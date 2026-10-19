import React from "react";
import DynamicAdminDocClient from "./DynamicAdminDocClient";

export function generateStaticParams() {
  return [
    { category: "memo" },
    { category: "memo_circular" },
    { category: "external" },
    { category: "external_circular" },
    { category: "order" },
    { category: "announcement" },
    { category: "meeting_report" },
    { category: "certificate" },
    { category: "custom" },
  ];
}

export default async function DynamicCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const resolved = await params;
  return <DynamicAdminDocClient categoryId={resolved.category} />;
}
