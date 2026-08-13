import { RequestComposerPage } from './RequestComposerPage';
export function OverPlanRequestPage() { return <RequestComposerPage useCaseId="OUT-03" title="Đề nghị xuất vượt kế hoạch" description="Hiển thị phần định mức đã giữ nhưng cho phép trình theo luồng vượt định mức." kind="over-plan" enforceLimit={false} />; }
