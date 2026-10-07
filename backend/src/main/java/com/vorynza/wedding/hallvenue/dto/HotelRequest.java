package com.vorynza.wedding.hallvenue.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record HotelRequest(
        @NotBlank(message = "Name is required")
        @Size(max = 150)
        String name,

        @NotBlank(message = "Location is required")
        @Size(max = 150)
        String location,

        String description,

        @Size(max = 80)
        String contact
) {
}
