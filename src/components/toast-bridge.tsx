"use client"

import { useEffect } from "react"

import { setToastFn } from "@/lib/api/http"
import { useToast } from "@/hooks/use-toast"

export function ToastBridge() {
  const { toast } = useToast()

  useEffect(() => {
    setToastFn((message, type) => {
      toast({
        title: message,
        variant: type === "error" ? "destructive" : "default",
      })
    })
  }, [toast])

  return null
}
