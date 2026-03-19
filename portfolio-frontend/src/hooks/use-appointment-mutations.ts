import { useMutation, useQueryClient } from "@tanstack/react-query";
import { agendaKeys } from "@/hooks/use-agenda-query";
import { dashboardKeys } from "@/hooks/use-dashboard-summary";
import {
  appointmentService,
  type AppointmentInput,
  type AppointmentPaymentStatus,
  type AppointmentStatus,
} from "@/services/appointmentService";

export function useAppointmentMutations() {
  const queryClient = useQueryClient();

  const invalidateAgenda = () =>
    queryClient.invalidateQueries({
      queryKey: agendaKeys.all,
    });

  const invalidateDashboard = () =>
    queryClient.invalidateQueries({
      queryKey: dashboardKeys.all,
    });

  const createMutation = useMutation({
    mutationFn: (input: AppointmentInput) => appointmentService.create(input),
    onSuccess: async () => {
      await Promise.all([invalidateAgenda(), invalidateDashboard()]);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ appointmentId, input }: { appointmentId: string; input: AppointmentInput }) =>
      appointmentService.update(appointmentId, input),
    onSuccess: async (_, variables) => {
      await Promise.all([
        invalidateAgenda(),
        invalidateDashboard(),
        queryClient.invalidateQueries({
          queryKey: agendaKeys.detail(variables.appointmentId),
        }),
      ]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (appointmentId: string) => appointmentService.remove(appointmentId),
    onSuccess: async () => {
      await Promise.all([invalidateAgenda(), invalidateDashboard()]);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({
      appointmentId,
      status,
    }: {
      appointmentId: string;
      status: AppointmentStatus;
    }) => appointmentService.updateStatus(appointmentId, status),
    onSuccess: async (_, variables) => {
      await Promise.all([
        invalidateAgenda(),
        invalidateDashboard(),
        queryClient.invalidateQueries({
          queryKey: agendaKeys.detail(variables.appointmentId),
        }),
      ]);
    },
  });

  const paymentStatusMutation = useMutation({
    mutationFn: ({
      appointmentId,
      paymentStatus,
    }: {
      appointmentId: string;
      paymentStatus: AppointmentPaymentStatus;
    }) => appointmentService.updatePaymentStatus(appointmentId, paymentStatus),
    onSuccess: async (_, variables) => {
      await Promise.all([
        invalidateAgenda(),
        invalidateDashboard(),
        queryClient.invalidateQueries({
          queryKey: agendaKeys.detail(variables.appointmentId),
        }),
      ]);
    },
  });

  return {
    createAppointment: createMutation.mutateAsync,
    updateAppointment: updateMutation.mutateAsync,
    deleteAppointment: deleteMutation.mutateAsync,
    updateAppointmentStatus: statusMutation.mutateAsync,
    updateAppointmentPaymentStatus: paymentStatusMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isUpdatingStatus: statusMutation.isPending,
    isUpdatingPaymentStatus: paymentStatusMutation.isPending,
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
    statusError: statusMutation.error,
    paymentStatusError: paymentStatusMutation.error,
  };
}
