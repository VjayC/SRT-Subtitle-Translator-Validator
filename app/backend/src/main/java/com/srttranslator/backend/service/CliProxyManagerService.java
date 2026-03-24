package com.srttranslator.backend.service;

import com.srttranslator.backend.model.Settings;
import com.srttranslator.backend.repository.SettingsRepository;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;

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
            logger.info("CLIProxyAPI is already running.");
            return;
        }

        Settings settings = settingsRepository.findById(1L).orElseGet(() -> {
            Settings defaults = new Settings();
            // Restored the defaults you wanted
            defaults.setCliCommandWindows("cli-proxy-api.exe --config \"%USERPROFILE%\\Downloads\\config.yaml\"");
            defaults.setCliCommandMac("/opt/homebrew/opt/cliproxyapi/bin/cliproxyapi --config \"$HOME/Downloads/config.yaml\"");
            defaults.setCliCommandLinux("cli-proxy-api --config \"$HOME/Downloads/config.yaml\"");
            return defaults;
        });

        String osName = System.getProperty("os.name").toLowerCase();
        ProcessBuilder builder;

        if (osName.contains("win")) {
            builder = new ProcessBuilder("cmd.exe", "/c", settings.getCliCommandWindows());
        } else if (osName.contains("mac")) {
            // Add "exec " so the shell replaces itself with the proxy binary
            builder = new ProcessBuilder("sh", "-c", "exec " + settings.getCliCommandMac());
        } else if (osName.contains("nix") || osName.contains("nux") || osName.contains("aix")) {
            // Add "exec " here as well
            builder = new ProcessBuilder("sh", "-c", "exec " + settings.getCliCommandLinux());
        } else {
            logger.warn("Unsupported Operating System. Cannot start CLIProxyAPI.");
            return;
        }

        try {
            logger.info("Attempting to start CLIProxyAPI with command via shell...");
            builder.redirectErrorStream(true); 
            proxyProcess = builder.start();
            logger.info("CLIProxyAPI process spawned successfully.");
        } catch (IOException e) {
            logger.error("Failed to start CLIProxyAPI.", e);
        }
    }

    @PreDestroy
    public void stopProxy() {
        if (isProxyRunning()) {
            logger.info("Application is shutting down. Terminating CLIProxyAPI...");
            
            // Explicitly kill any child processes first (crucial for Windows cmd.exe wrapper)
            proxyProcess.descendants().forEach(ProcessHandle::destroy);
            
            // Then kill the main process
            proxyProcess.destroy(); 
            
            try {
                Thread.sleep(1000); 
                if (proxyProcess.isAlive()) {
                    logger.warn("CLIProxyAPI did not terminate cleanly. Forcing shutdown...");
                    proxyProcess.descendants().forEach(ProcessHandle::destroyForcibly);
                    proxyProcess.destroyForcibly();
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            logger.info("CLIProxyAPI terminated.");
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