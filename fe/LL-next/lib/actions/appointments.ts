'use server';

import { auth } from '@/lib/auth';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import type { Appointment } from '@/lib/types/appointment';

// Input validation schemas
const createAppointmentSchema = z.object({
  patientId: z.string().min(1),
  doctorId: z.string().min(1),
  dateTime: z.string().datetime(),
  duration: z.number().min(15).max(240), // minutes
  type: z.enum(['consultation', 'follow-up', 'emergency', 'routine-checkup']),
  status: z.enum(['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled']).optional().default('scheduled'),
  reason: z.string().min(1).max(500),
  notes: z.string().optional(),
  location: z
    .object({
      type: z.enum(['in-person', 'video', 'phone']),
      details: z.string().optional(),
    })
    .optional(),
});

const updateAppointmentSchema = createAppointmentSchema.partial().extend({
  id: z.string(),
});

const searchAppointmentsSchema = z.object({
  patientId: z.string().optional(),
  doctorId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.enum(['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled']).optional(),
  page: z.number().optional().default(1),
  limit: z.number().optional().default(10),
});

const rescheduleAppointmentSchema = z.object({
  id: z.string(),
  newDateTime: z.string().datetime(),
  reason: z.string().optional(),
});

// Response types
export interface AppointmentsListResponse {
  appointments: Appointment[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Create a new appointment
 * @param appointmentData - Appointment information
 * @returns Created appointment
 */
export async function createAppointment(
  appointmentData: z.infer<typeof createAppointmentSchema>
): Promise<ActionResult<Appointment>> {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // Validate input
    const validatedData = createAppointmentSchema.parse(appointmentData);

    // Call API route
    const response = await fetch('/api/appointment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatedData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || 'Failed to create appointment',
      };
    }

    const appointment: Appointment = await response.json();

    // Revalidate relevant pages
    revalidatePath('/dashboard/appointments');
    revalidatePath('/dashboard');

    return {
      success: true,
      data: appointment,
    };
  } catch (error) {
    console.error('Create appointment error:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.errors.map((e) => e.message).join(', ')}`,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create appointment',
    };
  }
}

/**
 * Update an existing appointment
 * @param appointmentData - Updated appointment information with ID
 * @returns Updated appointment
 */
export async function updateAppointment(
  appointmentData: z.infer<typeof updateAppointmentSchema>
): Promise<ActionResult<Appointment>> {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // Validate input
    const validatedData = updateAppointmentSchema.parse(appointmentData);

    // Call API route
    const response = await fetch(`/api/appointment`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatedData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || 'Failed to update appointment',
      };
    }

    const appointment: Appointment = await response.json();

    // Revalidate relevant pages
    revalidatePath('/dashboard/appointments');
    revalidatePath('/dashboard');

    return {
      success: true,
      data: appointment,
    };
  } catch (error) {
    console.error('Update appointment error:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.errors.map((e) => e.message).join(', ')}`,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update appointment',
    };
  }
}

/**
 * Cancel an appointment
 * @param appointmentId - Appointment ID to cancel
 * @param reason - Cancellation reason
 * @returns Cancelled appointment
 */
export async function cancelAppointment(appointmentId: string, reason?: string): Promise<ActionResult<Appointment>> {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // Update appointment status to cancelled
    return updateAppointment({
      id: appointmentId,
      status: 'cancelled',
      notes: reason ? `Cancelled: ${reason}` : 'Cancelled by user',
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel appointment',
    };
  }
}

/**
 * Reschedule an appointment
 * @param rescheduleData - Reschedule information
 * @returns Rescheduled appointment
 */
export async function rescheduleAppointment(
  rescheduleData: z.infer<typeof rescheduleAppointmentSchema>
): Promise<ActionResult<Appointment>> {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // Validate input
    const validatedData = rescheduleAppointmentSchema.parse(rescheduleData);

    // Update appointment with new date/time
    return updateAppointment({
      id: validatedData.id,
      dateTime: validatedData.newDateTime,
      notes: validatedData.reason ? `Rescheduled: ${validatedData.reason}` : 'Rescheduled by user',
    });
  } catch (error) {
    console.error('Reschedule appointment error:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.errors.map((e) => e.message).join(', ')}`,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reschedule appointment',
    };
  }
}

/**
 * Get appointments with filters and pagination
 * @param searchParams - Search parameters
 * @returns Paginated appointment list
 */
export async function searchAppointments(
  searchParams?: z.infer<typeof searchAppointmentsSchema>
): Promise<ActionResult<AppointmentsListResponse>> {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // Validate input
    const validatedParams = searchAppointmentsSchema.parse(searchParams || {});

    // Build query string
    const queryParams = new URLSearchParams();
    if (validatedParams.patientId) queryParams.append('patientId', validatedParams.patientId);
    if (validatedParams.doctorId) queryParams.append('doctorId', validatedParams.doctorId);
    if (validatedParams.startDate) queryParams.append('startDate', validatedParams.startDate);
    if (validatedParams.endDate) queryParams.append('endDate', validatedParams.endDate);
    if (validatedParams.status) queryParams.append('status', validatedParams.status);
    queryParams.append('page', validatedParams.page.toString());
    queryParams.append('limit', validatedParams.limit.toString());

    // Call API route
    const response = await fetch(`/api/appointment?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || 'Failed to search appointments',
      };
    }

    const data: AppointmentsListResponse = await response.json();

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Search appointments error:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.errors.map((e) => e.message).join(', ')}`,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search appointments',
    };
  }
}

/**
 * Get upcoming appointments for the current user
 * @param limit - Maximum number of appointments to return
 * @returns List of upcoming appointments
 */
export async function getUpcomingAppointments(limit: number = 5): Promise<ActionResult<Appointment[]>> {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // Search for upcoming appointments
    const result = await searchAppointments({
      patientId: session.user.id,
      startDate: new Date().toISOString(),
      status: 'scheduled',
      page: 1,
      limit,
    });

    if (!result.success) {
      return result;
    }

    return {
      success: true,
      data: result.data?.appointments || [],
    };
  } catch (error) {
    console.error('Get upcoming appointments error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get upcoming appointments',
    };
  }
}

/**
 * Mark appointment as completed
 * @param appointmentId - Appointment ID
 * @param notes - Completion notes
 * @returns Updated appointment
 */
export async function completeAppointment(appointmentId: string, notes?: string): Promise<ActionResult<Appointment>> {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // Update appointment status to completed
    return updateAppointment({
      id: appointmentId,
      status: 'completed',
      notes: notes || 'Appointment completed',
    });
  } catch (error) {
    console.error('Complete appointment error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete appointment',
    };
  }
}

/**
 * Send appointment reminder
 * @param appointmentId - Appointment ID
 * @returns Success status
 */
export async function sendAppointmentReminder(appointmentId: string): Promise<ActionResult<{ sent: boolean }>> {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // TODO: Implement reminder sending logic
    // This would integrate with notification service

    return {
      success: true,
      data: { sent: true },
    };
  } catch (error) {
    console.error('Send reminder error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send reminder',
    };
  }
}
