package com.militaryassetmgmt.service;

import com.militaryassetmgmt.dto.request.TransferRequest;
import com.militaryassetmgmt.dto.response.TransferResponse;
import com.militaryassetmgmt.entity.Transfer;
import com.militaryassetmgmt.util.PageResponse;

import java.time.LocalDate;

public interface ITransferService {

    TransferResponse createTransfer(TransferRequest request, String username);

    PageResponse<TransferResponse> getTransfers(Long fromBaseId, Long toBaseId, Long equipmentTypeId,
                                                Transfer.Status status, LocalDate startDate, LocalDate endDate,
                                                int page, int size, String sortBy, String sortDir, String username);

    TransferResponse getTransferById(Long id, String username);
    
    TransferResponse approveTransfer(Long id, String username);

    TransferResponse receiveTransfer(Long id, String username);

    TransferResponse cancelTransfer(Long id, String cancellationReason, String username);

    TransferResponse markInTransit(Long id, String username);
}
