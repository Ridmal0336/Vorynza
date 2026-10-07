package com.vorynza.wedding.hallvenue.dto;

import com.vorynza.wedding.hallvenue.entity.Hotel;

public record HotelResponse(
        Long id,
        String name,
        String location,
        String description,
        String contact
) {
    public static HotelResponse from(Hotel hotel) {
        return new HotelResponse(
                hotel.getId(),
                hotel.getName(),
                hotel.getLocation(),
                hotel.getDescription(),
                hotel.getContact()
        );
    }
}
