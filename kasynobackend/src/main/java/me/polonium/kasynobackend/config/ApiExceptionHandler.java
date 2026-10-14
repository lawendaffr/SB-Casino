package me.polonium.kasynobackend.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(ResponseStatusException.class)
    ResponseEntity<ApiErrorResponse> handleStatus(ResponseStatusException exception,
                                                   HttpServletRequest request) {
        HttpStatus status = HttpStatus.valueOf(exception.getStatusCode().value());
        return ResponseEntity.status(status).body(error(status, exception.getReason(), request));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiErrorResponse> handleValidation(MethodArgumentNotValidException exception,
                                                        HttpServletRequest request) {
        String message = exception.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .findFirst().orElse("Request validation failed");
        return ResponseEntity.badRequest().body(error(HttpStatus.BAD_REQUEST, message, request));
    }

    @ExceptionHandler({ConstraintViolationException.class, HttpMessageNotReadableException.class,
            IllegalArgumentException.class, MethodArgumentTypeMismatchException.class})
    ResponseEntity<ApiErrorResponse> handleBadRequest(Exception exception, HttpServletRequest request) {
        String message = exception instanceof HttpMessageNotReadableException
                ? "Request body is invalid" : exception.getMessage();
        return ResponseEntity.badRequest().body(error(HttpStatus.BAD_REQUEST, message, request));
    }

    private ApiErrorResponse error(HttpStatus status, String message, HttpServletRequest request) {
        return new ApiErrorResponse(LocalDateTime.now(), status.value(), status.getReasonPhrase(),
                message == null ? status.getReasonPhrase() : message, request.getRequestURI());
    }

    public record ApiErrorResponse(LocalDateTime timestamp, int status, String error,
                                   String message, String path) { }
}
