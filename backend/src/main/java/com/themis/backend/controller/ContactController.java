package com.themis.backend.controller;

import com.themis.backend.dto.ContactRequest;
import com.themis.backend.dto.ContactResponse;
import com.themis.backend.model.ContactInquiry;
import com.themis.backend.service.ContactService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/contact")
public class ContactController {
    private final ContactService contactService;

    public ContactController(ContactService contactService) {
        this.contactService = contactService;
    }

    @PostMapping
    public ContactResponse submit(@Valid @RequestBody ContactRequest request) {
        ContactInquiry inquiry = contactService.create(request);
        return new ContactResponse("送出成功，感謝您的來信！", inquiry.getId());
    }
}
