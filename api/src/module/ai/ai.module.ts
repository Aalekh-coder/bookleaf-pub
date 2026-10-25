
import { Module } from "@nestjs/common";
import { AiService } from "./ai.service.js";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "../../prisma/prisma.module.js";

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
