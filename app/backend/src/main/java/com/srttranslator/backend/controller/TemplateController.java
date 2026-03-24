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
        // Fetch them in the saved order!
        return repository.findAllByOrderByDisplayOrderAsc();
    }

    @PostMapping
    public Template saveTemplate(@RequestBody Template template) {
        // If it's a new template, put it at the end of the list automatically
        if (!repository.existsById(template.getId())) {
            template.setDisplayOrder((int) repository.count());
        }
        return repository.save(template);
    }

    // NEW: Endpoint to accept an ordered list of IDs and update their positions
    @PutMapping("/reorder")
    public void reorderTemplates(@RequestBody List<String> orderedIds) {
        for (int i = 0; i < orderedIds.size(); i++) {
            String id = orderedIds.get(i);
            
            // Create an effectively final copy of the index for the lambda
            final int orderIndex = i; 
            
            repository.findById(id).ifPresent(template -> {
                template.setDisplayOrder(orderIndex); // Use the final copy here
                repository.save(template);
            });
        }
    }

    @DeleteMapping("/{id}")
    public void deleteTemplate(@PathVariable String id) {
        repository.deleteById(id);
    }
}