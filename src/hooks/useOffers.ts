/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { createNotification } from "./useNotifications";
import { useAuth } from "../context/AuthContext";

export interface Offer {
  id: string;
  inserted_at: string;
  updated_at: string;
  candidate_id: string | null;
  candidate_name: string;
  job_id: string | null;
  job_title: string;
  template: string | null;
  ctc_band: string | null;
  offered_ctc: string | null;
  offer_date: string | null;
  expiry_date: string;
  status: "pending" | "accepted" | "rejected" | "expired" | "withdrawn";
  sent_via: string | null;
  benefits: string[] | null;
  notes: string | null;
  response_deadline: string | null;
  acceptance_notes: string | null;
  response_date: string | null;
}

export interface OfferStats {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  expired: number;
  withdrawn: number;
  expiring_soon: number;
  acceptanceRate: number;
  avgCTC: string;
}

// ✅ helper: ensure recruiterId is UUID
async function resolveRecruiterId(user: any): Promise<string | null> {
  if (!user) return null;

  // If already UUID
  if (user.id) return user.id;

  // If only email → look up recruiter in DB
  if (user.email) {
    const { data, error } = await supabase
      .from("recruiters")
      .select("id")
      .eq("email", user.email)
      .maybeSingle();

    if (error) {
      console.error("resolveRecruiterId error:", error);
      return null;
    }
    return data?.id || null;
  }

  return null;
}

export const useOffers = () => {
  const { user } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all offers
  const fetchOffers = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("offers")
        .select("*")
        .order("inserted_at", { ascending: false });

      if (fetchError) throw fetchError;

      setOffers(data || []);
    } catch (err: any) {
      console.error("Error fetching offers:", err);
      setError(err.message || "Failed to fetch offers");
    } finally {
      setLoading(false);
    }
  };

  // Create a new offer
  const createOffer = async (offerData: Partial<Offer>) => {
    try {
      const { data, error: createError } = await supabase
        .from("offers")
        .insert([offerData])
        .select()
        .single();

      if (createError) throw createError;

      setOffers((prev) => [data, ...prev]);

      const recruiterId = await resolveRecruiterId(user);
      if (data && recruiterId) {
        await createNotification(
          recruiterId,
          "offer_created",
          "New Offer Created",
          `Offer created for ${data.candidate_name}`,
        );
      }

      return { success: true, data };
    } catch (err: any) {
      console.error("Error creating offer:", err);
      return { success: false, error: err.message || "Failed to create offer" };
    }
  };

  // Update an offer
  const updateOffer = async (id: string, updates: Partial<Offer>) => {
    try {
      const { data, error: updateError } = await supabase
        .from("offers")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (updateError) throw updateError;

      setOffers((prev) => prev.map((o) => (o.id === id ? data : o)));

      const recruiterId = await resolveRecruiterId(user);
      if (data && recruiterId) {
        if (data.status === "accepted") {
          await createNotification(
            recruiterId,
            "offer_accepted",
            "Offer Accepted",
            `${data.candidate_name} accepted the offer`,
          );
        } else if (data.status === "rejected") {
          await createNotification(
            recruiterId,
            "offer_declined",
            "Offer Rejected",
            `${data.candidate_name} rejected the offer`,
          );
        } else if (data.status === "withdrawn") {
          await createNotification(
            recruiterId,
            "offer_withdrawn",
            "Offer Withdrawn",
            `Offer for ${data.candidate_name} was withdrawn`,
          );
        }
      }

      return { success: true, data };
    } catch (err: any) {
      console.error("Error updating offer:", err);
      return { success: false, error: err.message || "Failed to update offer" };
    }
  };

  // Delete an offer
  const deleteOffer = async (id: string) => {
    try {
      const { error: deleteError } = await supabase.from("offers").delete().eq("id", id);
      if (deleteError) throw deleteError;

      setOffers((prev) => prev.filter((o) => o.id !== id));

      const recruiterId = await resolveRecruiterId(user);
      if (recruiterId) {
        await createNotification(
          recruiterId,
          "offer_declined",
          "Offer Deleted",
          "An offer was deleted",
        );
      }

      return { success: true };
    } catch (err: any) {
      console.error("Error deleting offer:", err);
      return { success: false, error: err.message || "Failed to delete offer" };
    }
  };

  // Withdraw an offer
  const withdrawOffer = async (id: string) => {
    return updateOffer(id, {
      status: "withdrawn",
      response_date: new Date().toISOString(),
    });
  };

  // Extend expiry
  const extendOfferExpiry = async (id: string, days: number) => {
    try {
      const { data: offer, error: fetchError } = await supabase
        .from("offers")
        .select("expiry_date, candidate_name")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      const currentExpiry = new Date(offer.expiry_date);
      currentExpiry.setDate(currentExpiry.getDate() + days);

      const result = await updateOffer(id, {
        expiry_date: currentExpiry.toISOString(),
        response_deadline: currentExpiry.toISOString(),
      });

      const recruiterId = await resolveRecruiterId(user);
      if (recruiterId) {
        await createNotification(
          recruiterId,
          "offer_expiring",
          "Offer Expiry Extended",
          `Offer for ${offer.candidate_name} was extended`,
        );
      }

      return result;
    } catch (err: any) {
      console.error("Error extending offer:", err);
      return { success: false, error: err.message || "Failed to extend offer" };
    }
  };

  // Accept an offer
  const acceptOffer = async (id: string, acceptanceNotes?: string) => {
    return updateOffer(id, {
      status: "accepted",
      response_date: new Date().toISOString(),
      acceptance_notes: acceptanceNotes,
    });
  };

  // Reject an offer
  const rejectOffer = async (id: string, rejectionNotes?: string) => {
    return updateOffer(id, {
      status: "rejected",
      response_date: new Date().toISOString(),
      acceptance_notes: rejectionNotes,
    });
  };

  // Stats
  const stats: OfferStats = useMemo(() => {
    const total = offers.length;
    const pending = offers.filter((o) => o.status === "pending").length;
    const accepted = offers.filter((o) => o.status === "accepted").length;
    const rejected = offers.filter((o) => o.status === "rejected").length;
    const expired = offers.filter((o) => o.status === "expired").length;
    const withdrawn = offers.filter((o) => o.status === "withdrawn").length;

    const now = new Date();
    const expiring_soon = offers.filter((o) => {
      if (o.status !== "pending") return false;
      const expiryDate = new Date(o.expiry_date);
      const diffDays = Math.ceil(
        (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return diffDays <= 2 && diffDays > 0;
    }).length;

    const responded = accepted + rejected;
    const acceptanceRate =
      responded > 0 ? Math.round((accepted / responded) * 100) : 0;

    const ctcValues = offers
      .filter((o) => o.offered_ctc)
      .map((o) => parseFloat(o.offered_ctc?.replace(/[^\d.]/g, "") || "0"))
      .filter((v) => v > 0);

    const avgCTC =
      ctcValues.length > 0
        ? (
            ctcValues.reduce((sum, val) => sum + val, 0) / ctcValues.length
          ).toFixed(1)
        : "0";

    return {
      total,
      pending,
      accepted,
      rejected,
      expired,
      withdrawn,
      expiring_soon,
      acceptanceRate,
      avgCTC,
    };
  }, [offers]);

  // Load offers once on mount
  useEffect(() => {
    fetchOffers();
  }, []);

  return {
    offers,
    loading,
    error,
    stats,
    createOffer,
    updateOffer,
    deleteOffer,
    withdrawOffer,
    extendOfferExpiry,
    acceptOffer,
    rejectOffer,
    refreshOffers: fetchOffers,
  };
};
