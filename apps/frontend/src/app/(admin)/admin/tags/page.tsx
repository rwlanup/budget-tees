'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { GitMerge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import { TagsTable } from '@/modules/tag/components/tags-table';
import { MergeTagsDialog } from '@/modules/tag/components/merge-tags-dialog';

export default function TagsPage() {
  const [mergeOpen, setMergeOpen] = React.useState(false);

  return (
    <div>
      <PageHeader
        title="Tags"
        description="Flat product labels for cross-cutting grouping."
        action={
          <Button variant="outline" onClick={() => setMergeOpen(true)}>
            <GitMerge className="size-4" aria-hidden />
            Merge tags
          </Button>
        }
      />
      <Suspense>
        <TagsTable />
      </Suspense>
      <MergeTagsDialog open={mergeOpen} onOpenChange={setMergeOpen} />
    </div>
  );
}
