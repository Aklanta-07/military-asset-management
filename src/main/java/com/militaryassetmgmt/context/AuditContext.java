package com.militaryassetmgmt.context;

import lombok.Getter;
import lombok.Setter;
import org.springframework.stereotype.Component;
import org.springframework.web.context.annotation.RequestScope;

@Getter
@Setter
@Component
@RequestScope
public class AuditContext {

    private String ipAddress;
    private String userAgent;
    private String correlationId;
}