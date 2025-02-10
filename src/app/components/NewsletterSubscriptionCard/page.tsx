"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

export default function NewsletterSubscriptionCard() {
  const [open, setOpen] = useState<boolean>(false);
  const [theme, setTheme] = useState<string>("");
  const [topics, setTopics] = useState<string[]>([]);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [status, setStatus] = useState<
    "idle" | "loading" | "completed" | "error"
  >("idle");
  const [sendingStatus, setSendingStatus] = useState<
    "sending" | "completed" | "failed" | "idle"
  >("idle");

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Function to fetch token using admin credentials
  const getAuthToken = async (): Promise<string | null> => {
    const formData = new FormData();

    formData.append(
      "username",
      JSON.stringify(process.env.NEXT_PUBLIC_USERNAME)
    );
    formData.append(
      "password",
      JSON.stringify(process.env.NEXT_PUBLIC_PASSWORD)
    );

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_KEY}/token`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Authentication failed");
      }

      const data = await response.json();
      return data.token;
    } catch (error) {
      console.error("Error fetching authentication token:", error);
      return null;
    }
  };

  const handleAddTheme = () => {
    if (theme.trim() && !topics.includes(theme.trim())) {
      setTopics([...topics, theme.trim()]);
      setTheme("");
    }
  };

  const handleRemoveTheme = (removedTheme: string) => {
    setTopics(topics.filter((t) => t !== removedTheme));
  };

  //enviar os temas do newsletter
  const handleSubmit = async (): Promise<void> => {
    if (topics.length === 0) return;
    setStatus("loading");
    setSendingStatus("sending");

    const token = await getAuthToken();
    if (!token) {
      setSendingStatus("failed");
      setStatus("error");
      return;
    }

    const headers = new Headers();
    headers.set("Authorization", `Bearer ${token}`);

    const formData = new FormData();
    formData.append("topics", JSON.stringify(topics));

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_KEY}/generate-newsletter`,
        {
          method: "POST",
          headers: headers,
          body: formData,
        }
      );

      if (!res.ok) {
        throw new Error("Error sending request");
      }

      const data = await res.json();
      console.log("API response:", data);

      setTaskId(data.task_id);
      setOpen(false);
      checkTaskStatus(data.task_id);
    } catch (error) {
      setStatus("error");
      setSendingStatus("failed");
      console.error("Error submitting request:", error);
    }
  };

  const checkTaskStatus = async (taskId: string): Promise<void> => {
    intervalRef.current = setInterval(async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_KEY}/tasks/${taskId}`
      );
      const data = await res.json();
      if (data.status === "completed") {
        setStatus("completed");
        setSendingStatus("completed");
        clearIntervalIfNeeded();
      }

      console.log("Check task data", data);
    }, 5000);
  };

  const clearIntervalIfNeeded = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleStop = () => {
    clearIntervalIfNeeded();
    setStatus("idle");
    setSendingStatus("idle");
  };

  return (
    <div className="p-6 border rounded-lg shadow-md w-auto text-center">
      <h2 className="text-xl font-bold">Newsletter</h2>
      <p className="text-gray-500">Receba conteúdos exclusivos!</p>
      <Button className="mt-4" onClick={() => setOpen(true)}>
        Assinar
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent aria-describedby="content">
          <DialogHeader>
            <DialogTitle>Escolha os temas</DialogTitle>
          </DialogHeader>
          <p>Me descreva quais temas do newsletter você deseja receber:</p>
          <div className="flex gap-2 mt-2">
            <Input value={theme} onChange={(e) => setTheme(e.target.value)} />
            <Button onClick={handleAddTheme}>Adicionar</Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {topics.map((t) => (
              <div
                key={t}
                className="flex items-center bg-gray-200 rounded-full px-3 py-1 text-sm"
              >
                {t}
                <button
                  onClick={() => handleRemoveTheme(t)}
                  className="ml-2 text-red-500"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>

          {status === "loading" ? (
            <div className="flex flex-col gap-0">
              <Button
                onClick={handleStop}
                size="sm"
                className="mt-4 bg-red-600 hover:bg-red-700 text-white"
              >
                <span className="loader" />
                Cancelar envio
              </Button>
            </div>
          ) : (
            <Button onClick={handleSubmit} className="mt-4">
              Enviar
            </Button>
          )}
          {status === "completed" && <p>Newsletter gerada com sucesso!</p>}
        </DialogContent>
      </Dialog>

      {sendingStatus !== "idle" && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white p-4 rounded-md shadow-lg flex items-center gap-2">
          {sendingStatus === "sending" && (
            <>
              <span className="loader" />
              <span>Enviando newsletter...</span>
            </>
          )}
          {sendingStatus === "completed" && (
            <span>Newsletter enviada com sucesso!</span>
          )}
          {sendingStatus === "failed" && (
            <span>Falha ao enviar a newsletter.</span>
          )}
        </div>
      )}
    </div>
  );
}
