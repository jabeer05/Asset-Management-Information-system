"use client";
import React from "react";
import { Box } from "@mui/material";
import MainNav from "@/components/MainNav";
import NotificationForm from "@/components/NotificationForm";

export default function NewNotificationPage() {
  return (
    <>
      <MainNav />
      <Box p={3}>
        <NotificationForm />
      </Box>
    </>
  );
} 