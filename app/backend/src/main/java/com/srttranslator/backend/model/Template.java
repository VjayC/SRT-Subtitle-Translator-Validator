package com.srttranslator.backend.model;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "saved_templates")
public class Template {

    @Id
    private String id; // We will use the UUID generated from React
    
    private String name;
    private String endpointUrl;
    private String liteModel;
    private String mainModel;

    @ElementCollection
    private List<String> scripts;

    @ElementCollection
    private List<String> defaultValues;

    @Column(columnDefinition = "TEXT")
    private String bodyText;

    @ElementCollection
    private List<String> placeholders;

    @Column(columnDefinition = "TEXT")
    private String rawContent;
    
    @Column(name = "display_order")
    private Integer displayOrder = 0;

    // Standard Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEndpointUrl() { return endpointUrl; }
    public void setEndpointUrl(String endpointUrl) { this.endpointUrl = endpointUrl; }
    public String getLiteModel() { return liteModel; }
    public void setLiteModel(String liteModel) { this.liteModel = liteModel; }
    public String getMainModel() { return mainModel; }
    public void setMainModel(String mainModel) { this.mainModel = mainModel; }
    public List<String> getScripts() { return scripts; }
    public void setScripts(List<String> scripts) { this.scripts = scripts; }
    public List<String> getDefaultValues() { return defaultValues; }
    public void setDefaultValues(List<String> defaultValues) { this.defaultValues = defaultValues; }
    public String getBodyText() { return bodyText; }
    public void setBodyText(String bodyText) { this.bodyText = bodyText; }
    public List<String> getPlaceholders() { return placeholders; }
    public void setPlaceholders(List<String> placeholders) { this.placeholders = placeholders; }
    public String getRawContent() { return rawContent; }
    public void setRawContent(String rawContent) { this.rawContent = rawContent; }
    public Integer getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }
}