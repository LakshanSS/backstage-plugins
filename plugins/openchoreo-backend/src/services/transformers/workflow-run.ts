import type { OpenChoreoComponents } from '@openchoreo/openchoreo-client-node';
import type { ComponentWorkflowRunResponse } from '@openchoreo/backstage-plugin-common';

// New K8s-style WorkflowRun (metadata + spec + status)
type WorkflowRun = OpenChoreoComponents['schemas']['WorkflowRun'];

/**
 * Transforms a new-API WorkflowRun (K8s-style) into the legacy
 * ComponentWorkflowRunResponse shape used by the frontend.
 * Component/project context is extracted from metadata labels.
 */
export function transformComponentWorkflowRun(
  run: WorkflowRun,
): ComponentWorkflowRunResponse {
  const labels = run.metadata?.labels ?? {};
  const annotations = run.metadata?.annotations ?? {};

  // Derive overall status from conditions
  const readyCondition = run.status?.conditions?.find(
    c => c.type === 'Ready',
  );
  const status =
    readyCondition?.reason ??
    (readyCondition?.status === 'True' ? 'Succeeded' : 'Running');

  return {
    name: run.metadata?.name ?? '',
    uuid: run.metadata?.uid ?? '',
    componentName: labels['openchoreo.dev/component'] ?? '',
    projectName: labels['openchoreo.dev/project'] ?? '',
    namespaceName: run.metadata?.namespace ?? '',
    status,
    commit: annotations['openchoreo.dev/commit'],
    image: annotations['openchoreo.dev/image'],
    createdAt: run.metadata?.creationTimestamp ?? new Date().toISOString(),
    workflow: run.spec?.workflow
      ? {
          name: run.spec.workflow.name,
          parameters: run.spec.workflow.parameters as Record<string, unknown>,
        }
      : undefined,
  };
}
