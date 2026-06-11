import { PageHeader } from '@/components/shared/page-header';
import { AttributesList } from '@/modules/attribute/components/attributes-list';

export const metadata = { title: 'Attributes · Admin', description: 'Manage product attributes.' };

export default function AttributesPage() {
  return (
    <div>
      <PageHeader
        title="Attributes"
        description="Reusable attributes and values for variants and filtering."
      />
      <AttributesList />
    </div>
  );
}
