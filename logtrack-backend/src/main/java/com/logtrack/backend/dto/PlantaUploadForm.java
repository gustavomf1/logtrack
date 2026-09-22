package com.logtrack.backend.dto;

import org.jboss.resteasy.reactive.RestForm;
import org.jboss.resteasy.reactive.multipart.FileUpload;

public class PlantaUploadForm {

    @RestForm("planta")
    public FileUpload planta;
}
