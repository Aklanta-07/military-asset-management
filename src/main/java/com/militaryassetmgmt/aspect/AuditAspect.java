package com.militaryassetmgmt.aspect;

import com.militaryassetmgmt.context.AuditContext;
import com.militaryassetmgmt.entity.AuditLog;
import com.militaryassetmgmt.service.AuditLogService;
import com.militaryassetmgmt.util.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class AuditAspect {

    private final AuditLogService auditLogService;
    private final AuditContext auditContext;

    @Around("@annotation(org.springframework.web.bind.annotation.PostMapping) || " +
            "@annotation(org.springframework.web.bind.annotation.PutMapping) || " +
            "@annotation(org.springframework.web.bind.annotation.PatchMapping) || " +
            "@annotation(org.springframework.web.bind.annotation.DeleteMapping)")
    public Object auditControllerMethod(ProceedingJoinPoint joinPoint) throws Throwable {

        // Execute the actual controller method first
        Object result = joinPoint.proceed();

        // Only audit successful controller execution
        try {
            String username = getCurrentUsername();

            if (username == null) {
                log.debug("Skipping audit because no authenticated user was found");
                return result;
            }

            String entityType = determineEntityType(joinPoint);
            AuditLog.Action action = determineAction(joinPoint);

            Long entityId = extractEntityId(joinPoint, result);

            auditLogService.logAction(
                    entityType,
                    entityId,
                    action,
                    null,
                    null,
                    null,
                    username,
                    auditContext.getIpAddress(),
                    auditContext.getUserAgent(),
                    auditContext.getCorrelationId(),
                    null
            );

        } catch (Exception e) {
            // Auditing must never break the business response
            log.error("Failed to create audit event", e);
        }

        return result;
    }

    private String getCurrentUsername() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            return null;
        }

        return authentication.getName();
    }

    private String determineEntityType(ProceedingJoinPoint joinPoint) {

        String controllerName =
                joinPoint.getTarget().getClass().getSimpleName();

        return controllerName
                .replace("Controller", "")
                .toUpperCase();
    }

    private AuditLog.Action determineAction(ProceedingJoinPoint joinPoint) {

    String methodName =
            joinPoint.getSignature().getName().toLowerCase();

    if (methodName.startsWith("create")
            || methodName.startsWith("add")) {
        return AuditLog.Action.CREATE;
    }

    if (methodName.startsWith("update")
            || methodName.startsWith("edit")) {
        return AuditLog.Action.UPDATE;
    }

    if (methodName.startsWith("delete")
            || methodName.startsWith("remove")) {
        return AuditLog.Action.DELETE;
    }

    if (methodName.startsWith("approve")) {
        return AuditLog.Action.APPROVE;
    }

    if (methodName.startsWith("receive")) {
        return AuditLog.Action.RECEIVE;
    }

    if (methodName.startsWith("cancel")) {
        return AuditLog.Action.CANCEL;
    }

    if (methodName.startsWith("assign")) {
        return AuditLog.Action.ASSIGN;
    }

    if (methodName.startsWith("return")) {
        return AuditLog.Action.RETURN;
    }

    if (methodName.startsWith("expend")) {
        return AuditLog.Action.EXPEND;
    }

    return AuditLog.Action.UPDATE;
    }

    private Long extractEntityId(
            ProceedingJoinPoint joinPoint,
            Object result) {

        if (result instanceof ApiResponse<?> apiResponse) {

            Object data = apiResponse.getData();

            if (data != null) {
                try {
                    Object id = data.getClass()
                            .getMethod("getId")
                            .invoke(data);

                    if (id instanceof Long) {
                        return (Long) id;
                    }
                } catch (Exception ignored) {
                    // Some response DTOs may not have an ID
                }
            }
        }

        // DELETE:
        // Usually the ID is a controller method argument.
        Object[] args = joinPoint.getArgs();

        for (Object arg : args) {

            if (arg instanceof Long) {
                return (Long) arg;
            }
        }

        return null;
    }
}