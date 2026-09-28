package com.militaryassetmgmt.service;

import com.militaryassetmgmt.dto.response.PersonnelResponse;

import java.util.List;

public interface IPersonnelService {

    List<PersonnelResponse> getPersonnel(Long baseId, Boolean activeOnly, String username);

    PersonnelResponse getById(Long id);

    PersonnelResponse getByServiceNumber(String serviceNumber);
}
