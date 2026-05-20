package com.fritomusic.fileexplorer

import android.os.Environment
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import java.io.File
import java.util.concurrent.Executors
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import java.util.concurrent.TimeUnit
import java.util.concurrent.CountDownLatch
import java.util.concurrent.atomic.AtomicReference

class FileExplorerModule : Module() {

    companion object {
        private val AUDIO_EXTENSIONS = setOf(
            "mp3", "flac", "wav", "aac", "m4a", "ogg", "wma",
            "opus", "webm", "oga", "mka", "aiff", "aif", "ape",
            "wv", "mpc", "ac3", "dts", "mp2", "3gp", "amr",
            "caf", "au", "tta", "dff", "dsf"
        )

        private val SKIP_DIRS = setOf(
            "Android", ".thumbnails", ".cache", "cache",
            "LOST.DIR", ".trash", ".Trash"
        )

        private val ioExecutor = Executors.newFixedThreadPool(2)
    }

    private fun isAudioFile(file: File): Boolean {
        val ext = file.extension.lowercase()
        return ext in AUDIO_EXTENSIONS
    }

    private fun hasAudioQuick(dir: File): Boolean {
        val children = dir.listFiles() ?: return false
        for (child in children) {
            if (child.name.startsWith(".")) continue
            if (child.isFile && isAudioFile(child)) return true
            if (child.isDirectory && child.name !in SKIP_DIRS) {
                val sub = child.listFiles() ?: continue
                for (subChild in sub) {
                    if (!subChild.name.startsWith(".") && subChild.isFile && isAudioFile(subChild)) return true
                }
            }
        }
        return false
    }

    private fun countAudioDirect(dir: File): Int {
        val children = dir.listFiles() ?: return 0
        var count = 0
        for (child in children) {
            if (!child.name.startsWith(".") && child.isFile && isAudioFile(child)) count++
        }
        return count
    }

    private fun listDirectorySync(path: String): Map<String, Any> {
        val dir = File(path)
        if (!dir.exists() || !dir.isDirectory) {
            return mapOf("folders" to emptyList<Map<String, Any>>(), "files" to emptyList<Map<String, Any>>())
        }

        val children = dir.listFiles() ?: return mapOf(
            "folders" to emptyList<Map<String, Any>>(),
            "files" to emptyList<Map<String, Any>>()
        )

        val folders = mutableListOf<Map<String, Any>>()
        val files = mutableListOf<Map<String, Any>>()

        for (child in children.sortedBy { it.name.lowercase() }) {
            if (child.name.startsWith(".")) continue

            if (child.isDirectory) {
                if (child.name in SKIP_DIRS) continue
                if (hasAudioQuick(child)) {
                    folders.add(mapOf(
                        "name" to child.name,
                        "path" to child.absolutePath,
                        "audioCount" to countAudioDirect(child)
                    ))
                }
            } else if (child.isFile && isAudioFile(child)) {
                files.add(mapOf(
                    "name" to child.nameWithoutExtension,
                    "filename" to child.name,
                    "path" to child.absolutePath,
                    "uri" to "file://${child.absolutePath}",
                    "size" to child.length(),
                    "lastModified" to child.lastModified(),
                    "extension" to child.extension.lowercase()
                ))
            }
        }

        return mapOf("folders" to folders, "files" to files)
    }

    private fun getAllAudioInDirectorySync(path: String): List<Map<String, Any>> {
        val dir = File(path)
        if (!dir.exists() || !dir.isDirectory) return emptyList()
        val results = mutableListOf<Map<String, Any>>()
        collectAudioFiles(dir, results, 10)
        return results
    }

    private fun collectAudioFiles(dir: File, results: MutableList<Map<String, Any>>, maxDepth: Int) {
        if (maxDepth <= 0 || !dir.exists() || !dir.isDirectory) return
        val children = dir.listFiles() ?: return
        for (child in children.sortedBy { it.name.lowercase() }) {
            if (child.name.startsWith(".")) continue
            if (child.isFile && isAudioFile(child)) {
                results.add(mapOf(
                    "name" to child.nameWithoutExtension,
                    "filename" to child.name,
                    "path" to child.absolutePath,
                    "uri" to "file://${child.absolutePath}",
                    "size" to child.length(),
                    "lastModified" to child.lastModified(),
                    "extension" to child.extension.lowercase(),
                    "folderPath" to (child.parent ?: "")
                ))
            } else if (child.isDirectory && child.name !in SKIP_DIRS) {
                collectAudioFiles(child, results, maxDepth - 1)
            }
        }
    }

    override fun definition() = ModuleDefinition {
        Name("FileExplorerModule")

        AsyncFunction("getStorageRoot") {
            Environment.getExternalStorageDirectory().absolutePath
        }

        AsyncFunction("listDirectory") { path: String, promise: Promise ->
            ioExecutor.execute {
                try {
                    val result = listDirectorySync(path)
                    promise.resolve(result)
                } catch (e: Exception) {
                    promise.reject("ERR_LIST_DIR", e.message ?: "Unknown error", e)
                }
            }
        }

        AsyncFunction("getAllAudioInDirectory") { path: String, promise: Promise ->
            ioExecutor.execute {
                try {
                    val result = getAllAudioInDirectorySync(path)
                    promise.resolve(result)
                } catch (e: Exception) {
                    promise.reject("ERR_GET_AUDIO", e.message ?: "Unknown error", e)
                }
            }
        }

        AsyncFunction("hasStoragePermission") {
            val rootDir = Environment.getExternalStorageDirectory()
            rootDir.exists() && rootDir.canRead()
        }

        Function("sendRequestSync") { url: String, options: Map<String, Any> ->
            val result = java.util.concurrent.atomic.AtomicReference<Map<String, Any>>()
            val latch = java.util.concurrent.CountDownLatch(1)

            ioExecutor.execute {
                try {
                    val client = okhttp3.OkHttpClient.Builder()
                        .connectTimeout(15, java.util.concurrent.TimeUnit.SECONDS)
                        .readTimeout(15, java.util.concurrent.TimeUnit.SECONDS)
                        .build()

                    val method = (options["method"] as? String)?.uppercase() ?: "GET"
                    val headersMap = options["headers"] as? Map<*, *>
                    val bodyStr = options["body"] as? String

                    val requestBuilder = okhttp3.Request.Builder().url(url)

                    headersMap?.forEach { (key, value) ->
                        if (key is String && value is String) {
                            requestBuilder.addHeader(key, value)
                        }
                    }

                    if (method == "POST" || method == "PUT" || method == "PATCH") {
                        val contentType = headersMap?.get("Content-Type") as? String ?: "application/json"
                        val mediaType = contentType.toMediaTypeOrNull()
                        val requestBody = (bodyStr ?: "").toRequestBody(mediaType)
                        requestBuilder.method(method, requestBody)
                    } else {
                        requestBuilder.method(method, null)
                    }

                    val response = client.newCall(requestBuilder.build()).execute()
                    val body = response.body?.string() ?: ""

                    val responseHeaders = mutableMapOf<String, String>()
                    response.headers.forEach { (key, value) ->
                        responseHeaders[key.lowercase()] = value
                    }

                    result.set(mapOf(
                        "status" to response.code,
                        "body" to body,
                        "headers" to responseHeaders,
                        "ok" to (response.code in 200..299)
                    ))
                } catch (e: Exception) {
                    result.set(mapOf(
                        "status" to 0,
                        "body" to "",
                        "headers" to emptyMap<String, String>(),
                        "ok" to false,
                        "error" to (e.message ?: e.toString())
                    ))
                } finally {
                    latch.countDown()
                }
            }

            try {
                latch.await(20, java.util.concurrent.TimeUnit.SECONDS)
            } catch (e: InterruptedException) {
                // Ignore
            }

            result.get() ?: mapOf(
                "status" to 0,
                "body" to "",
                "headers" to emptyMap<String, String>(),
                "ok" to false,
                "error" to "Timeout"
            )
        }
    }
}
