package com.militaryassetmgmt;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class MilitaryAssetManagementApplication {

	public static void main(String[] args) {
		SpringApplication.run(MilitaryAssetManagementApplication.class, args);
	}

}
