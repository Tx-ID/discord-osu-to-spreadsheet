import { Controller, Get } from "@nestjs/common";
import { renderTextHtml } from "./osu-provider/osu-html-templates";

import { ConfigService } from "@nestjs/config";
import Configuration from "src/config";
const local_config = Configuration();

@Controller()
export class AppController {
    private html_config;

    constructor(_: ConfigService) {
        this.html_config = _.get<typeof local_config.html>("html");
    }

    @Get()
    getHello(): string {
        return renderTextHtml(
            this.html_config.title,
            this.html_config.description,
        );
    }
}
