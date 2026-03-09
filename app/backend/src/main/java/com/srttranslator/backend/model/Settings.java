package com.srttranslator.backend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "global_settings")
public class Settings {
    
    @Id
    private Long id = 1L; // We only ever want one row of settings

    private String apiEndpoint;
    private String apiKey;
    private String liteModel;
    private String mainModel;
    private String cliCommandWindows;
    private String cliCommandMac;
    private String cliCommandLinux;

    // Standard Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getApiEndpoint() { return apiEndpoint; }
    public void setApiEndpoint(String apiEndpoint) { this.apiEndpoint = apiEndpoint; }
    public String getApiKey() { return apiKey; }
    public void setApiKey(String apiKey) { this.apiKey = apiKey; }
    public String getLiteModel() { return liteModel; }
    public void setLiteModel(String liteModel) { this.liteModel = liteModel; }
    public String getMainModel() { return mainModel; }
    public void setMainModel(String mainModel) { this.mainModel = mainModel; }
    public String getCliCommandWindows() { return cliCommandWindows; }
    public void setCliCommandWindows(String cliCommandWindows) { this.cliCommandWindows = cliCommandWindows; }
    public String getCliCommandMac() { return cliCommandMac; }
    public void setCliCommandMac(String cliCommandMac) { this.cliCommandMac = cliCommandMac; }
    public String getCliCommandLinux() { return cliCommandLinux; }
    public void setCliCommandLinux(String cliCommandLinux) { this.cliCommandLinux = cliCommandLinux; }
}