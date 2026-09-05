package com.orion.auto;

import org.json.JSONObject;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

/** Downloads a short neural TTS response from OpenAI to a temporary MP3 file. */
public final class OpenAiSpeechClient {
    private static final String ENDPOINT = "https://api.openai.com/v1/audio/speech";

    private OpenAiSpeechClient() {}

    public static File synthesize(File cacheDir, String apiKey, String voice, String text) throws Exception {
        URL url = new URL(ENDPOINT);
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setRequestMethod("POST");
        connection.setConnectTimeout(15_000);
        connection.setReadTimeout(45_000);
        connection.setDoOutput(true);
        connection.setRequestProperty("Authorization", "Bearer " + apiKey.trim());
        connection.setRequestProperty("Content-Type", "application/json; charset=utf-8");

        JSONObject payload = new JSONObject();
        payload.put("model", "gpt-4o-mini-tts");
        payload.put("voice", voice == null || voice.trim().isEmpty() ? "onyx" : voice.trim());
        payload.put("input", text);
        payload.put("response_format", "mp3");
        payload.put("speed", 0.96);
        payload.put("instructions",
                "Fale em português do Brasil com voz masculina adulta, grave, natural e calma. " +
                "Soa como um copiloto premium: seguro, objetivo, próximo, sem teatralidade. " +
                "Dicção clara e ritmo moderado.");

        byte[] body = payload.toString().getBytes(StandardCharsets.UTF_8);
        connection.setFixedLengthStreamingMode(body.length);
        try (OutputStream output = connection.getOutputStream()) {
            output.write(body);
        }

        int code = connection.getResponseCode();
        if (code < 200 || code >= 300) {
            String message = "Falha na voz OpenAI (" + code + ")";
            InputStream error = connection.getErrorStream();
            if (error != null) {
                try (InputStream ignored = error) {
                    // Closing is enough; avoid retaining API error payloads on disk.
                }
            }
            connection.disconnect();
            throw new IllegalStateException(message);
        }

        File out = File.createTempFile("orion-voice-", ".mp3", cacheDir);
        try (InputStream input = new BufferedInputStream(connection.getInputStream());
             FileOutputStream file = new FileOutputStream(out)) {
            byte[] buffer = new byte[8192];
            int read;
            while ((read = input.read(buffer)) >= 0) {
                if (read > 0) file.write(buffer, 0, read);
            }
        } finally {
            connection.disconnect();
        }
        return out;
    }
}
