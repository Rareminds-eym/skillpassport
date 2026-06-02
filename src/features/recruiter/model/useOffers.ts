/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost, apiDelete } from '@/shared/api/apiClient';

import { NotificationType } from "./useNotifications";
import { createNotification } from '@/features/notifications/api/notificationService';

import { useUser } from '@/shared/model/authStore';

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

export interface OfferFilters {
  status?: string[];
  candidateName?: string;
  jobTitle?: string;
  ctcBandMin?: number;
  ctcBandMax?: number;
  offeredCtcMin?: number;
  offeredCtcMax?: number;
  offerDateFrom?: string;
  offerDateTo?: string;
  expiryDateFrom?: string;
  expiryDateTo?: string;
  templates?: string[];
  sentVia?: string[];
  benefits?: string[];
}

export interface OfferSortOptions {
  field: 'inserted_at' | 'updated_at' | 'offer_date' | 'expiry_date' | 'candidate_name' | 'job_title' | 'offered_ctc' | 'status' | 'template' | 'response_date';
  direction: 'asc' | 'desc';
  nullsPosition?: 'first' | 'last';
  secondarySort?: {
    field: 'inserted_at' | 'updated_at' | 'offer_date' | 'expiry_date' | 'candidate_name' | 'job_title';
    direction: 'asc' | 'desc';
  };
}

function buildOfferParams(currentFilters?: OfferFilters, currentSort?: OfferSortOptions): string {
  const params = new URLSearchParams();
  if (!currentFilters && !currentSort) return '';

  if (currentFilters?.status && currentFilters.status.length > 0) {
    params.set('status', currentFilters.status.join(','));
  }
  if (currentFilters?.candidateName) params.set('candidateName', currentFilters.candidateName);
  if (currentFilters?.jobTitle) params.set('jobTitle', currentFilters.jobTitle);
  if (currentFilters?.offerDateFrom) params.set('offerDateFrom', currentFilters.offerDateFrom);
  if (currentFilters?.offerDateTo) params.set('offerDateTo', currentFilters.offerDateTo);
  if (currentFilters?.expiryDateFrom) params.set('expiryDateFrom', currentFilters.expiryDateFrom);
  if (currentFilters?.expiryDateTo) params.set('expiryDateTo', currentFilters.expiryDateTo);

  const sortField = currentSort?.field || 'inserted_at';
  const sortDir = currentSort?.direction || 'desc';
  params.set('sortField', sortField);
  params.set('sortDir', sortDir);

  return params.toString();
}

export const useOffers = (filters?: OfferFilters, sort?: OfferSortOptions) => {
  const user = useUser();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOffers = async (currentFilters?: OfferFilters, currentSort?: OfferSortOptions) => {
    try {
      setLoading(true);
      setError(null);

      const qs = buildOfferParams(currentFilters, currentSort);
      const path = `/recruiter/offers${qs ? `?${qs}` : ''}`;
      const response: any = await apiGet(path);
      let data: Offer[] = response?.data?.offers ?? [];

      if (currentFilters) {
        if (currentFilters.offeredCtcMin !== undefined || currentFilters.offeredCtcMax !== undefined) {
          data = data.filter(offer => {
            if (!offer.offered_ctc) return false;
            const ctcValue = parseFloat(offer.offered_ctc.replace(/[^\d.]/g, "") || "0");
            if (currentFilters.offeredCtcMin !== undefined && ctcValue < currentFilters.offeredCtcMin) return false;
            if (currentFilters.offeredCtcMax !== undefined && ctcValue > currentFilters.offeredCtcMax) return false;
            return true;
          });
        }
        if (currentFilters.benefits && currentFilters.benefits.length > 0) {
          data = data.filter(offer =>
            offer.benefits && offer.benefits.some(b => currentFilters.benefits!.includes(b))
          );
        }
      }

      setOffers(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch offers");
    } finally {
      setLoading(false);
    }
  };

  const createOffer = async (offerData: Partial<Offer>) => {
    try {
      const response: any = await apiPost('/recruiter/offers', offerData);
      const data = response?.data?.offer;
      if (!data) throw new Error('Failed to create offer');
      setOffers((prev) => [data, ...prev]);

      if (data && user) {
        await createNotification(
          user.email ?? user.id,
          "offer_created",
          "New Offer Created",
          `Offer created for ${data.candidate_name}`
        );
      }

      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to create offer" };
    }
  };

  const updateOffer = async (id: string, updates: Partial<Offer>) => {
    try {
      const response: any = await apiPost('/recruiter/offers', {
        id, ...updates,
        updated_at: new Date().toISOString(),
      });
      const data = response?.data?.offer;
      if (!data) throw new Error('Failed to update offer');
      setOffers((prev) => prev.map((o) => (o.id === id ? data : o)));

      if (data && user) {
        let type: NotificationType | null = null;
        let title = "";
        let message = "";

        if (data.status === "accepted") {
          type = "offer_accepted";
          title = "Offer Accepted";
          message = `${data.candidate_name} accepted the offer`;
        } else if (data.status === "rejected") {
          type = "offer_declined";
          title = "Offer Rejected";
          message = `${data.candidate_name} rejected the offer`;
        } else if (data.status === "withdrawn") {
          type = "offer_withdrawn";
          title = "Offer Withdrawn";
          message = `Offer for ${data.candidate_name} was withdrawn`;
        }

        if (type) {
          await createNotification(user.email ?? user.id, type, title, message);
        }
      }

      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to update offer" };
    }
  };

  const deleteOffer = async (id: string) => {
    try {
      await apiDelete(`/recruiter/offers?id=${encodeURIComponent(id)}`);
      setOffers((prev) => prev.filter((o) => o.id !== id));

      if (user) {
        await createNotification(
          user.email ?? user.id,
          "offer_declined",
          "Offer Deleted",
          "An offer was deleted"
        );
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to delete offer" };
    }
  };

  const withdrawOffer = async (id: string) => {
    return updateOffer(id, {
      status: "withdrawn",
      response_date: new Date().toISOString(),
    });
  };

  const extendOfferExpiry = async (id: string, days: number) => {
    try {
      const response: any = await apiGet(`/recruiter/offers?id=${encodeURIComponent(id)}`);
      const offersList: Offer[] = response?.data?.offers ?? [];
      const offer = offersList[0];
      if (!offer) throw new Error('Offer not found');

      const currentExpiry = new Date(offer.expiry_date);
      currentExpiry.setDate(currentExpiry.getDate() + days);

      const result = await updateOffer(id, {
        expiry_date: currentExpiry.toISOString(),
        response_deadline: currentExpiry.toISOString(),
      });

      if (user) {
        await createNotification(
          user.email ?? user.id,
          "offer_expiring",
          "Offer Expiry Extended",
          `Offer for ${offer.candidate_name} was extended`
        );
      }

      return result;
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to extend offer" };
    }
  };

  const acceptOffer = async (id: string, acceptanceNotes?: string) => {
    return updateOffer(id, {
      status: "accepted",
      response_date: new Date().toISOString(),
      acceptance_notes: acceptanceNotes,
    });
  };

  const rejectOffer = async (id: string, rejectionNotes?: string) => {
    return updateOffer(id, {
      status: "rejected",
      response_date: new Date().toISOString(),
      acceptance_notes: rejectionNotes,
    });
  };

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
      const diffDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 2 && diffDays > 0;
    }).length;

    const responded = accepted + rejected;
    const acceptanceRate = responded > 0 ? Math.round((accepted / responded) * 100) : 0;

    const ctcValues = offers
      .filter((o) => o.offered_ctc)
      .map((o) => parseFloat(o.offered_ctc?.replace(/[^\d.]/g, "") || "0"))
      .filter((v) => v > 0);

    const avgCTC = ctcValues.length > 0
      ? (ctcValues.reduce((sum, val) => sum + val, 0) / ctcValues.length).toFixed(1)
      : "0";

    return { total, pending, accepted, rejected, expired, withdrawn, expiring_soon, acceptanceRate, avgCTC };
  }, [offers]);

  useEffect(() => {
    fetchOffers(filters, sort);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sort]);

  return {
    offers, loading, error, stats,
    createOffer, updateOffer, deleteOffer,
    withdrawOffer, extendOfferExpiry,
    acceptOffer, rejectOffer,
    refreshOffers: fetchOffers,
  };
};
