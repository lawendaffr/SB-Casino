package me.polonium.kasynobackend.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class PageController {

    @GetMapping("/")
    public String home() {
        return "forward:/index.html";
    }

    @GetMapping("/login")
    public String login() {
        return "forward:/login.html";
    }

    @GetMapping("/dashboard")
    public String dashboard() {
        return "forward:/dashboard.html";
    }

    @GetMapping("/blackjack")
    public String blackjack() {
        return "forward:/blackjack.html";
    }

    @GetMapping("/history")
    public String history() {
        return "forward:/history.html";
    }

    @GetMapping("/deposit")
    public String deposit() {
        return "forward:/deposit.html";
    }
}