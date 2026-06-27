"use client";

import { useEffect } from "react";
import { useNavigate } from "@/lib/react-router-compat";

export default function AdminIndexPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/admin/dashboard", { replace: true });
  }, [navigate]);

  return null;
}
