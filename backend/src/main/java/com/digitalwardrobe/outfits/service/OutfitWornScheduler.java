package com.digitalwardrobe.outfits.service;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class OutfitWornScheduler {

    private final OutfitService outfitService;

    public OutfitWornScheduler(OutfitService outfitService) {
        this.outfitService = outfitService;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void processDuePlannedDatesOnStartup() {
        outfitService.processDuePlannedDates();
    }

    @Scheduled(cron = "0 5 * * * *", zone = "UTC")
    public void processDuePlannedDatesHourly() {
        outfitService.processDuePlannedDates();
    }
}
