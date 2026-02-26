export type DomainEvent =
  | {
      type: "VISITOR_ARRIVED";
      societyId: string;
      flatId: string;
      entryId: string;
      visitorName: string;
      requestId?: string | null;
    }
  | {
      type: "VISITOR_REQUEST_DECIDED";
      societyId: string;
      flatId: string;
      requestId: string;
      visitorName: string;
      status: "APPROVED" | "REJECTED";
    }
  | {
      type: "NOTICE_POSTED";
      societyId: string;
      noticeId: string;
      title: string;
      postedByUserId: string;
    };
