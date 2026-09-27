package com.militaryassetmgmt.dto.response;

import java.time.LocalDate;

import com.militaryassetmgmt.entity.Transfer;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class TransferSummary {

    private final Long id;
    private final Integer quantity;
    private final LocalDate transferDate;
    private Transfer.Status status;
    private final String fromBaseCode;
    private final String toBaseCode;
    private final String fromBaseName;
    private final String toBaseName;
}