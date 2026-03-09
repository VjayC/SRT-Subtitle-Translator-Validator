package com.srttranslator.backend.controller;

import com.srttranslator.backend.model.Template;
import com.srttranslator.backend.repository.TemplateRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/templates")
@CrossOrigin(origins = "*")
public class TemplateController {

    private final TemplateRepository repository;

    public TemplateController(TemplateRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Template> getAllTemplates() {
        return repository.findAll();
    }

    @PostMapping
    public Template saveTemplate(@RequestBody Template template) {
        return repository.save(template);
    }

    @DeleteMapping("/{id}")
    public void deleteTemplate(@PathVariable String id) {
        repository.deleteById(id);
    }
}