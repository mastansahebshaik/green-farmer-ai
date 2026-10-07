import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const KINDS = ["chemical", "organic", "bio", "micronutrient"];

export function FertilizerForm({
  onDone,
  submitLabel = "Add fertiliser",
  tone = "light",
}: {
  onDone?: () => void;
  submitLabel?: string;
  tone?: "light" | "dark";
}) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "",
    kind: "chemical",
    nutrients: "",
    crops: "",
    problems: "",
    dosage: "",
    timing: "",
    price_range: "",
    notes: "",
  });

  const set =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      setBusy(false);
      toast.error("Please sign in again.");
      return;
    }
    const { error } = await supabase.from("fertilizers").insert({
      name: form.name.trim(),
      created_by: authData.user.id,
      kind: form.kind,
      nutrients: form.nutrients.trim() || null,
      crops: form.crops.split(",").map((s) => s.trim()).filter(Boolean),
      problems: form.problems.split(",").map((s) => s.trim()).filter(Boolean),
      dosage: form.dosage.trim() || null,
      timing: form.timing.trim() || null,
      price_range: form.price_range.trim() || null,
      notes: form.notes.trim() || null,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Fertiliser added");
    setForm({
      name: "",
      kind: "chemical",
      nutrients: "",
      crops: "",
      problems: "",
      dosage: "",
      timing: "",
      price_range: "",
      notes: "",
    });
    await qc.invalidateQueries({ queryKey: ["fertilizers"] });
    await qc.invalidateQueries({ queryKey: ["admin-fertilizers"] });
    onDone?.();
  };

  const field =
    "w-full rounded-xl bg-cream px-4 py-3 text-base font-medium text-soil ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-leaf";

  return (
    <form
      onSubmit={submit}
      className={`space-y-2.5 rounded-2xl p-4 ring-1 ring-black/10 ${
        tone === "dark" ? "bg-cream-2" : "bg-cream-2"
      }`}
    >
      <div className="grid gap-2.5 sm:grid-cols-2">
        <input className={field} placeholder="Name (e.g. Urea)" value={form.name} onChange={set("name")} required />
        <select className={field} value={form.kind} onChange={set("kind")}>
          {KINDS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        <input className={field} placeholder="Nutrients (e.g. N 46%)" value={form.nutrients} onChange={set("nutrients")} />
        <input className={field} placeholder="Crops, comma separated" value={form.crops} onChange={set("crops")} />
        <input
          className={field}
          placeholder="Problems it solves, comma separated"
          value={form.problems}
          onChange={set("problems")}
        />
        <input className={field} placeholder="How much per acre" value={form.dosage} onChange={set("dosage")} />
        <input className={field} placeholder="When to apply" value={form.timing} onChange={set("timing")} />
        <input className={field} placeholder="Approx price" value={form.price_range} onChange={set("price_range")} />
      </div>
      <input className={field} placeholder="Notes for farmers" value={form.notes} onChange={set("notes")} />
      <button
        type="submit"
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-leaf py-3.5 text-base font-semibold text-cream disabled:opacity-70"
      >
        {busy ? <Loader2 className="size-5 animate-spin" /> : <Plus className="size-5" />}
        {submitLabel}
      </button>
    </form>
  );
}
