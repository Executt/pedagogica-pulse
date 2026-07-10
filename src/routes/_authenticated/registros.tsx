import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Camera, Image as ImageIcon, FileText, Mic, Upload, Search, Filter,
  FileAudio, FileImage, File as FileIcon, X, Plus, Loader2, Tag,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser, useMyRoles } from "@/hooks/use-current-user";
import { MobileShell } from "@/components/mobile-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/registros")({
  component: RegistrosPage,
});

type Material = {
  id: string;
  name: string;
  description: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  tags: string[] | null;
  created_at: string;
  url: string;
  class_id: string | null;
  student_id: string | null;
  school_id: string;
  classes?: { name: string } | null;
  students?: { full_name: string } | null;
};

function RegistrosPage() {
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<"all" | "audio" | "image" | "doc">("all");
  const [open, setOpen] = useState(false);

  const list = useQuery({
    queryKey: ["materials-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("materials")
        .select("*, classes(name), students(full_name)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as Material[];
    },
  });

  const filtered = useMemo(() => {
    const t = q.toLowerCase().trim();
    return (list.data ?? []).filter((m) => {
      if (kind !== "all" && !matchKind(m.mime_type, kind)) return false;
      if (!t) return true;
      const bag = [
        m.name, m.description ?? "", (m.tags ?? []).join(" "),
        m.classes?.name ?? "", m.students?.full_name ?? "",
      ].join(" ").toLowerCase();
      return bag.includes(t);
    });
  }, [list.data, q, kind]);

  return (
    <MobileShell
      title="Registros"
      action={
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button size="sm" className="rounded-xl h-9"><Plus className="size-4 mr-1" />Novo</Button>
          </SheetTrigger>
          <UploadSheet onDone={() => setOpen(false)} />
        </Sheet>
      }
    >
      <div className="px-5 pt-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, aluno, tag..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-11 pl-10 rounded-xl bg-secondary/50 border-transparent"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
          {[
            { k: "all", label: "Todos", icon: Filter },
            { k: "audio", label: "Áudios", icon: FileAudio },
            { k: "image", label: "Imagens", icon: FileImage },
            { k: "doc", label: "Documentos", icon: FileText },
          ].map((f) => (
            <button
              key={f.k}
              onClick={() => setKind(f.k as any)}
              className={`inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-medium border shrink-0 transition ${
                kind === f.k ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border"
              }`}
            >
              <f.icon className="size-3.5" />
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 mt-4 space-y-2">
        {list.isLoading && <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>}
        {!list.isLoading && filtered.length === 0 && (
          <div className="py-16 text-center">
            <FolderEmptyIcon />
            <p className="text-sm text-muted-foreground mt-3">Nenhum registro ainda.</p>
            <p className="text-xs text-muted-foreground mt-1">Toque em <b>Novo</b> para enviar áudio, foto ou documento.</p>
          </div>
        )}
        {filtered.map((m) => <MaterialCard key={m.id} m={m} />)}
      </div>
    </MobileShell>
  );
}

function matchKind(mime: string | null, kind: "audio" | "image" | "doc") {
  const m = (mime || "").toLowerCase();
  if (kind === "audio") return m.startsWith("audio/");
  if (kind === "image") return m.startsWith("image/");
  return !m.startsWith("audio/") && !m.startsWith("image/");
}

function MaterialCard({ m }: { m: Material }) {
  const mime = (m.mime_type || "").toLowerCase();
  const isAudio = mime.startsWith("audio/");
  const isImage = mime.startsWith("image/");
  const Icon = isAudio ? FileAudio : isImage ? FileImage : FileText;
  const tintCls = isAudio ? "bg-accent/15 text-accent" : isImage ? "bg-primary/10 text-primary" : "bg-info/15 text-info";
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  const openFile = async () => {
    try {
      const path = extractPathFromUrl(m.url);
      const { data, error } = await supabase.storage.from("materials").createSignedUrl(path, 300);
      if (error) throw error;
      window.open(data.signedUrl, "_blank");
    } catch (e: any) {
      toast.error(e.message ?? "Falha ao abrir");
    }
  };

  const previewAudio = async () => {
    if (signedUrl) return;
    const path = extractPathFromUrl(m.url);
    const { data } = await supabase.storage.from("materials").createSignedUrl(path, 300);
    if (data) setSignedUrl(data.signedUrl);
  };

  return (
    <Card className="p-3 rounded-2xl">
      <div className="flex items-start gap-3">
        <div className={`size-11 rounded-xl ${tintCls} grid place-items-center shrink-0`}>
          <Icon className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{m.name}</p>
          {m.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{m.description}</p>}
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {m.students?.full_name && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-foreground/80">
                {m.students.full_name}
              </span>
            )}
            {m.classes?.name && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-foreground/80">
                {m.classes.name}
              </span>
            )}
            {(m.tags ?? []).map((t) => (
              <span key={t} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                #{t}
              </span>
            ))}
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-[10px] text-muted-foreground">
              {new Date(m.created_at).toLocaleDateString("pt-BR")} · {humanSize(m.size_bytes)}
            </p>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={isAudio ? previewAudio : openFile}>
              {isAudio ? (signedUrl ? "Tocando" : "Ouvir") : "Abrir"}
            </Button>
          </div>
          {isAudio && signedUrl && (
            <audio className="w-full mt-2" controls autoPlay src={signedUrl} />
          )}
        </div>
      </div>
    </Card>
  );
}

function extractPathFromUrl(url: string) {
  const marker = "/materials/";
  const i = url.indexOf(marker);
  if (i === -1) return url;
  return url.slice(i + marker.length);
}

function humanSize(bytes?: number | null) {
  if (!bytes) return "";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function FolderEmptyIcon() {
  return (
    <div className="size-16 mx-auto rounded-2xl bg-muted grid place-items-center">
      <FolderUp className="size-8 text-muted-foreground/60" />
    </div>
  );
}

import { FolderUp } from "lucide-react";

/* ---------------- Upload Sheet ---------------- */

function UploadSheet({ onDone }: { onDone: () => void }) {
  const user = useCurrentUser();
  const roles = useMyRoles();
  const qc = useQueryClient();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [classId, setClassId] = useState<string>("");
  const [studentId, setStudentId] = useState<string>("");
  const [schoolId, setSchoolId] = useState<string>("");
  const [progress, setProgress] = useState(0);

  const schools = roles.data?.map((r) => ({ id: r.school_id, name: r.schools?.name ?? "Escola" })) ?? [];
  const effectiveSchool = schoolId || schools[0]?.id || "";

  const classes = useQuery({
    queryKey: ["upload-classes", effectiveSchool],
    enabled: !!effectiveSchool,
    queryFn: async () => {
      const { data, error } = await supabase.from("classes").select("id, name").eq("school_id", effectiveSchool).order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
  const students = useQuery({
    queryKey: ["upload-students", classId],
    enabled: !!classId,
    queryFn: async () => {
      const { data, error } = await supabase.from("students").select("id, full_name").eq("class_id", classId).order("full_name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const pick = (r: React.RefObject<HTMLInputElement | null>) => r.current?.click();

  const onFile = (f: File | null) => {
    if (!f) return;
    setFile(f);
    if (!name) setName(f.name.replace(/\.[^.]+$/, ""));
  };

  const upload = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Não autenticado");
      if (!file) throw new Error("Selecione um arquivo");
      if (!name.trim()) throw new Error("Dê um nome ao registro");
      if (!effectiveSchool) throw new Error("Escola não definida");

      const ext = file.name.split(".").pop() || "bin";
      const key = `${user.id}/${effectiveSchool}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
      setProgress(10);

      const { error: upErr } = await supabase.storage.from("materials").upload(key, file, {
        contentType: file.type || undefined,
        upsert: false,
      });
      if (upErr) throw upErr;
      setProgress(70);

      const tags = tagsText.split(",").map((t) => t.trim()).filter(Boolean);
      const { error: insErr } = await supabase.from("materials").insert({
        school_id: effectiveSchool,
        class_id: classId || null,
        student_id: studentId || null,
        uploader_id: user.id,
        name: name.trim(),
        description: description.trim() || null,
        mime_type: file.type || null,
        size_bytes: file.size,
        tags: tags.length ? tags : null,
        url: key,
      });
      if (insErr) throw insErr;
      setProgress(100);
    },
    onSuccess: () => {
      toast.success("Registro enviado");
      qc.invalidateQueries({ queryKey: ["materials-list"] });
      qc.invalidateQueries({ queryKey: ["class"] });
      setFile(null); setName(""); setDescription(""); setTagsText("");
      setClassId(""); setStudentId(""); setProgress(0);
      onDone();
    },
    onError: (e: any) => { toast.error(e.message ?? "Falha no envio"); setProgress(0); },
  });

  return (
    <SheetContent side="bottom" className="rounded-t-2xl h-[92vh] p-0 flex flex-col">
      <SheetHeader className="px-5 pt-5 pb-3 border-b">
        <SheetTitle>Novo registro</SheetTitle>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Source pickers */}
        <div className="grid grid-cols-2 gap-2">
          <SourceBtn icon={Camera} label="Câmera" onClick={() => pick(cameraRef)} />
          <SourceBtn icon={ImageIcon} label="Galeria" onClick={() => pick(galleryRef)} />
          <SourceBtn icon={Mic} label="Áudio" onClick={() => pick(audioRef)} />
          <SourceBtn icon={FileIcon} label="Documento" onClick={() => pick(docRef)} />
        </div>
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
        <input ref={galleryRef} type="file" accept="image/*,video/*" hidden onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
        <input ref={audioRef} type="file" accept="audio/*" capture hidden onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
        <input ref={docRef} type="file" accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx" hidden onChange={(e) => onFile(e.target.files?.[0] ?? null)} />

        {file && (
          <Card className="p-3 rounded-xl flex items-center gap-3">
            <div className="size-10 rounded-lg bg-primary/10 text-primary grid place-items-center">
              <Upload className="size-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{file.name}</p>
              <p className="text-[10px] text-muted-foreground">{(file.size / 1024).toFixed(0)} KB · {file.type || "arquivo"}</p>
            </div>
            <Button variant="ghost" size="icon" className="size-7" onClick={() => setFile(null)}>
              <X className="size-4" />
            </Button>
          </Card>
        )}

        <div className="space-y-3">
          <div>
            <Label className="text-xs">Nome do registro</Label>
            <Input placeholder="Ex.: Áudio da mãe do João sobre dificuldades em casa"
              value={name} onChange={(e) => setName(e.target.value)} className="mt-1 rounded-xl" />
          </div>
          <div>
            <Label className="text-xs">Descrição (opcional)</Label>
            <Textarea placeholder="Contexto, data, observações..." value={description}
              onChange={(e) => setDescription(e.target.value)} className="mt-1 rounded-xl min-h-[70px]" />
          </div>
          <div>
            <Label className="text-xs flex items-center gap-1"><Tag className="size-3" /> Tags (separadas por vírgula)</Label>
            <Input placeholder="família, comportamento, reforço"
              value={tagsText} onChange={(e) => setTagsText(e.target.value)} className="mt-1 rounded-xl" />
          </div>

          {schools.length > 1 && (
            <div>
              <Label className="text-xs">Escola</Label>
              <Select value={effectiveSchool} onValueChange={setSchoolId}>
                <SelectTrigger className="mt-1 rounded-xl"><SelectValue placeholder="Escola" /></SelectTrigger>
                <SelectContent>{schools.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label className="text-xs">Turma (opcional)</Label>
            <Select value={classId || "none"} onValueChange={(v) => { setClassId(v === "none" ? "" : v); setStudentId(""); }}>
              <SelectTrigger className="mt-1 rounded-xl"><SelectValue placeholder="Selecionar turma" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem turma</SelectItem>
                {(classes.data ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Aluno (opcional)</Label>
            <Select value={studentId || "none"} onValueChange={(v) => setStudentId(v === "none" ? "" : v)} disabled={!classId}>
              <SelectTrigger className="mt-1 rounded-xl">
                <SelectValue placeholder={classId ? "Selecionar aluno" : "Escolha uma turma primeiro"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem aluno específico</SelectItem>
                {(students.data ?? []).map((s) => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {progress > 0 && (
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      <SheetFooter className="px-5 py-3 border-t bg-background">
        <Button
          className="w-full h-11 rounded-xl"
          disabled={!file || !name.trim() || upload.isPending}
          onClick={() => upload.mutate()}
        >
          {upload.isPending ? <><Loader2 className="size-4 mr-2 animate-spin" /> Enviando...</> : <><Upload className="size-4 mr-2" /> Enviar registro</>}
        </Button>
      </SheetFooter>
    </SheetContent>
  );
}

function SourceBtn({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="flex flex-col items-center justify-center gap-1.5 h-20 rounded-2xl bg-secondary/60 border border-border/60 active:scale-[0.98] transition">
      <Icon className="size-5 text-primary" />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}