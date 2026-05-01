package com.srttranslator.backend.service;

import com.srttranslator.backend.model.Settings;
import com.srttranslator.backend.repository.SettingsRepository;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class CliProxyManagerService {

    private static final Logger logger = LoggerFactory.getLogger(CliProxyManagerService.class);
    private Process proxyProcess;
    private final SettingsRepository settingsRepository;

    public CliProxyManagerService(SettingsRepository settingsRepository) {
        this.settingsRepository = settingsRepository;
    }

    // Removed @PostConstruct so it doesn't start automatically
    public void startProxy() {
        if (isProxyRunning()) {
            logger.info("CLI Proxy is already running.");
            return;
        }

        Settings settings = settingsRepository.findById(1L).orElseGet(() -> {
            Settings defaults = new Settings();
            // Restored the defaults you wanted
            defaults.setCliCommandWindows("\"%USERPROFILE%\\Desktop\\cli-proxy-api\" --config \"%USERPROFILE%\\Desktop\\config.yaml\"");
            defaults.setCliCommandMac("\"/opt/homebrew/opt/cliproxyapi/bin/cliproxyapi\" --config \"$HOME/Desktop/config.yaml\"");
            defaults.setCliCommandLinux("\"$HOME/cliproxyapi/cli-proxy-api\" --config \"$HOME/Desktop/config.yaml\"");
            return defaults;
        });

        String osName = System.getProperty("os.name").toLowerCase();
        ProcessBuilder builder;

        if (osName.contains("win")) {
            // Add "/s" and wrap the entire command string in an extra set of quotes
            builder = new ProcessBuilder("cmd.exe", "/s", "/c", "\"" + settings.getCliCommandWindows() + "\"");
        } else if (osName.contains("mac")) {
            // Add "exec " so the shell replaces itself with the proxy binary
            builder = new ProcessBuilder("sh", "-c", "exec " + settings.getCliCommandMac());
        } else if (osName.contains("nix") || osName.contains("nux") || osName.contains("aix")) {
            // Add "exec " here as well
            builder = new ProcessBuilder("sh", "-c", "exec " + settings.getCliCommandLinux());
        } else {
            logger.warn("Unsupported Operating System. Cannot start CLI proxy.");
            return;
        }

        try {
            logger.info("Attempting to start CLI Proxy with command via shell...");
            builder.redirectErrorStream(true); 
            proxyProcess = builder.start();
            
            // --- ADDED: Read the output stream to prevent OS hangs and see logs ---
            new Thread(() -> {
                try (java.io.BufferedReader reader = new java.io.BufferedReader(
                        new java.io.InputStreamReader(proxyProcess.getInputStream()))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        logger.info("[CLI Proxy]: " + line);
                    }
                } catch (Exception e) {
                    logger.error("Error reading proxy output.", e);
                }
            }).start();
            // ----------------------------------------------------------------------
            
            // --- ADDED: Wait a split second to see if the command instantly crashes ---
            Thread.sleep(500); 
            
            if (!proxyProcess.isAlive()) {
                logger.error("CLI Proxy crashed immediately! Exit code: " + proxyProcess.exitValue());
                proxyProcess = null; // Clear the dead process so the UI knows it's offline
            } else {
                logger.info("CLI Proxy process spawned successfully.");
            }
            // --------------------------------------------------------------------------

        } catch (Exception e) { // Changed to Exception to also catch InterruptedException
            logger.error("Failed to start CLI Proxy.", e);
            proxyProcess = null;
        }
    }

    @PreDestroy
    public void stopProxy() {
        if (isProxyRunning()) {
            logger.info("Application is shutting down. Terminating CLI Proxy...");
            
            // Explicitly kill any child processes first (crucial for Windows cmd.exe wrapper)
            proxyProcess.descendants().forEach(ProcessHandle::destroy);
            
            // Then kill the main process
            proxyProcess.destroy(); 
            
            try {
                Thread.sleep(1000); 
                if (proxyProcess.isAlive()) {
                    logger.warn("CLI Proxy did not terminate cleanly. Forcing shutdown...");
                    proxyProcess.descendants().forEach(ProcessHandle::destroyForcibly);
                    proxyProcess.destroyForcibly();
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            logger.info("CLI Proxy terminated.");
        }
    }

    public void restartProxy() {
        stopProxy();
        startProxy();
    }

    // New helper to check status
    public boolean isProxyRunning() {
        return proxyProcess != null && proxyProcess.isAlive();
    }
}