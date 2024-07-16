const mongoose = require('mongoose');
const { DateTime } = require('luxon');
const DocRegister = require('./models/docRegister');

async function generateTimeSlotsForAllDoctors(startDate, endDate, startTime, endTime, intervalMinutes) {
    await mongoose.connect('mongodb://localhost:27017/healingHandDB', { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        const doctors = await DocRegister.find();
        if (!doctors || doctors.length === 0) {
            throw new Error('No doctors found');
        }

        const lunchStart = { hour: 12, minute: 0 };
        const lunchEnd = { hour: 14, minute: 0 };

        for (const doctor of doctors) {
            let slots = [];
            let currentDate = DateTime.fromISO(startDate);
            const finalDate = DateTime.fromISO(endDate);

            while (currentDate <= finalDate) {
                // Check if time slots for the current date already exist
                const existingSlots = doctor.availableSlots.some(slot => slot.date === currentDate.toISODate());

                if (!existingSlots) {
                    let currentStartTime = currentDate.set({ hour: startTime.hour, minute: startTime.minute });
                    const currentEndTime = currentDate.set({ hour: endTime.hour, minute: endTime.minute });

                    while (currentStartTime < currentEndTime) {
                        // Skip slots during lunch hours
                        if (!(currentStartTime.hour >= lunchStart.hour && currentStartTime.hour < lunchEnd.hour)) {
                            const slotEndTime = currentStartTime.plus({ minutes: intervalMinutes });
                            if (slotEndTime <= currentEndTime) {
                                slots.push({
                                    date: currentDate.toISODate(),
                                    startTime: currentStartTime.toISOTime({ suppressMilliseconds: true }),
                                    endTime: slotEndTime.toISOTime({ suppressMilliseconds: true }),
                                    isAvailable: true
                                });
                            }
                        }
                        currentStartTime = currentStartTime.plus({ minutes: intervalMinutes });
                    }
                }

                currentDate = currentDate.plus({ days: 1 });
            }

            if (slots.length > 0) {
                doctor.availableSlots.push(...slots);
                await doctor.save();
            }
        }

        console.log('Time slots generated successfully for all doctors');
    } catch (err) {
        console.error('Error generating time slots for all doctors:', err);
    } finally {
        await mongoose.disconnect();
    }
}

// Set startDate as today and endDate as today + 4 days
const startDate = DateTime.local().toISODate();
const endDate = DateTime.local().plus({ days: 4 }).toISODate();
const startTime = { hour: 9, minute: 0 };
const endTime = { hour: 17, minute: 0 };
const intervalMinutes = 30;

generateTimeSlotsForAllDoctors(startDate, endDate, startTime, endTime, intervalMinutes);
