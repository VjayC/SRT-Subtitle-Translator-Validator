package com.srttranslator.backend.controller;

import com.srttranslator.backend.service.CliProxyManagerService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/proxy")
@CrossOrigin(origins = "*")
public class ProxyController {

    private final CliProxyManagerService proxyService;

    public ProxyController(CliProxyManagerService proxyService) {
        this.proxyService = proxyService;
    }

    @GetMapping("/status")
    public Map<String, Boolean> getStatus() {
        return Map.of("running", proxyService.isProxyRunning());
    }

    @PostMapping("/start")
    public Map<String, Boolean> startProxy() {
        proxyService.startProxy();
        return Map.of("running", proxyService.isProxyRunning());
    }

    @PostMapping("/stop")
    public Map<String, Boolean> stopProxy() {
        proxyService.stopProxy();
        return Map.of("running", proxyService.isProxyRunning());
    }

    @PostMapping("/shutdown")
    public void shutdown() {
        // 1. Explicitly kill the proxy BEFORE responding to Tauri
        proxyService.stopProxy();
        
        // 2. Now queue up the JVM shutdown
        new Thread(() -> {
            try {
                Thread.sleep(200); 
            } catch (InterruptedException e) {}
            
            System.exit(0); 
        }).start();
    }
}