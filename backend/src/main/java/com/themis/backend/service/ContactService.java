package com.themis.backend.service;

import com.themis.backend.dto.ContactRequest;
import com.themis.backend.model.ContactInquiry;
import com.themis.backend.repository.ContactInquiryRepository;
import org.springframework.stereotype.Service;

@Service
public class ContactService {
    private final ContactInquiryRepository contactInquiryRepository;

    public ContactService(ContactInquiryRepository contactInquiryRepository) {
        this.contactInquiryRepository = contactInquiryRepository;
    }

    public ContactInquiry create(ContactRequest request) {
        ContactInquiry inquiry = new ContactInquiry();
        inquiry.setName(request.name());
        inquiry.setEmail(request.email());
        inquiry.setPhone(request.phone());
        inquiry.setSpaceType(request.spaceType());
        inquiry.setBudget(request.budget());
        inquiry.setSquare(request.square());
        inquiry.setWt(request.wt());
        inquiry.setMessage(request.message());
        return contactInquiryRepository.save(inquiry);
    }
}
