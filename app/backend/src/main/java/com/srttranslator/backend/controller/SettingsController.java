package com.srttranslator.backend.controller;

import com.srttranslator.backend.model.Settings;
import com.srttranslator.backend.repository.SettingsRepository;
import com.srttranslator.backend.service.CliProxyManagerService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings")
@CrossOrigin(origins = "*")
public class SettingsController {

    private final SettingsRepository repository;
    private final CliProxyManagerService cliProxyManagerService;

    // Inject the CliProxyManagerService
    public SettingsController(SettingsRepository repository, CliProxyManagerService cliProxyManagerService) {
        this.repository = repository;
        this.cliProxyManagerService = cliProxyManagerService;
    }

    @GetMapping
    public Settings getSettings() {
        return repository.findById(1L).orElseGet(() -> {
            Settings defaultSettings = new Settings();
            // Updated defaults as requested
            defaultSettings.setApiEndpoint("http://localhost:8317/v1/chat/completions");
            defaultSettings.setLiteModel("gemini-3-flash-preview");
            defaultSettings.setMainModel("gemini-3.1-pro-preview");
            defaultSettings.setCliCommandWindows("cli-proxy-api.exe --config \"%USERPROFILE%\\Downloads\\config.yaml\"");
            defaultSettings.setCliCommandMac("/opt/homebrew/opt/cliproxyapi/bin/cliproxyapi --config \"$HOME/Downloads/config.yaml\"");
            defaultSettings.setCliCommandLinux("cli-proxy-api --config \"$HOME/Downloads/config.yaml\"");
            return repository.save(defaultSettings);
        });
    }

    @PutMapping
    public Settings updateSettings(@RequestBody Settings updatedSettings) {
        updatedSettings.setId(1L); // Force ID 1 to maintain single row
        Settings saved = repository.save(updatedSettings);
        
        // Restart the proxy immediately using the new commands
        cliProxyManagerService.restartProxy();
        
        return saved;
    }
}