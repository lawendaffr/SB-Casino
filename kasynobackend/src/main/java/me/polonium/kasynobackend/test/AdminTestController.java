package me.polonium.kasynobackend.test;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminTestController {
    @GetMapping("/test")
    public String test() {
        return "You are an admin.";
    }
}
