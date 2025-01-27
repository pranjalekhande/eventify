const express = require("express");
const Invitation = require("../models/Invitation");
const authMiddleware = require("../middleware/authMiddleware");
const Event = require("../models/Event");



const router = express.Router();


router.get("/dashboard",authMiddleware, async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.user.id }); // Example logic
    res.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).send("Server error");
  }
});

router.get("/dashboard/:eventId", authMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ msg: "Event not found" });

    if (event.organizer.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Not authorized to view analytics for this event" });
    }
    
    const totalInvites = await Invitation.countDocuments({ event: eventId });
    const accepted = await Invitation.countDocuments({ event: eventId, rsvpStatus: "Accepted" });
    const declined = await Invitation.countDocuments({ event: eventId, rsvpStatus: "Declined" });
    const pending = await Invitation.countDocuments({ event: eventId, rsvpStatus: "Pending" });

   
    res.json({
      event: {
        title: event.title,
        date: event.date,
        location: event.location,
      },
      analytics: {
        totalInvites,
        accepted,
        declined,
        pending,
      },
    });
  } catch (error) {
    console.error("Error fetching event analytics:", error);
    res.status(500).send("Server error");
  }
});

router.get("/dashboard/rsvp/:eventId/invitations", authMiddleware, async (req, res) => {
    try {
      const { eventId } = req.params;
  
     
      const event = await Event.findById(eventId);
      if (!event) return res.status(404).json({ msg: "Event not found" });
  
      if (event.organizer.toString() !== req.user.id ) {
        return res.status(401).json({ msg: "Not authorized to view RSVPs for this event" });
      }
  
      const rsvpList = await Invitation.find({ event: eventId }).select("inviteeEmail rsvpStatus");
  
      res.json(rsvpList);
    } catch (error) {
      console.error("Error fetching RSVP list:", error);
      res.status(500).send("Server error");
    }
  });

  router.put("/dashboard/rsvp/:invitationId/invitations", async (req, res) => {
    const { rsvpStatus } = req.body;
  
    try {
      
      if (!["Accepted", "Declined"].includes(rsvpStatus)) {
        return res.status(400).json({ msg: "Invalid RSVP status" });
      }
  
      const invitation = await Invitation.findById(req.params.invitationId);
      if (!invitation) return res.status(404).json({ msg: "Invitation not found" });
  
      invitation.rsvpStatus = rsvpStatus;
      await invitation.save();
  
      res.json({ msg: `RSVP updated to "${rsvpStatus}"`, invitation });
    } catch (error) {
      console.error("Error updating RSVP status:", error);
      res.status(500).send("Server error");
    }
  });
   
  router.delete("/dashboard/rsvp/:eventId/:invitationId", authMiddleware, async (req, res) => {
    try {
      const { eventId, invitationId } = req.params;
  
      const invitation = await Invitation.findById(invitationId);
      if (!invitation) return res.status(404).json({ msg: "Invitation not found" });
  
      if (invitation.event.toString() !== eventId) {
        return res.status(400).json({ msg: "Invitation does not belong to the specified event" });
      }
  
     
      const event = await Event.findById(eventId);
      if (!event) return res.status(404).json({ msg: "Event not found" });
  
     
      if (event.organizer.toString() !== req.user.id) {
        return res.status(401).json({ msg: "Not authorized to delete invitations for this event" });
      }
  
      await invitation.deleteOne();
  
      res.json({ msg: "Invitation deleted successfully" });
    } catch (error) {
      console.error("Error deleting invitation:", error);
      res.status(500).send("Server error");
    }
  });  
// router.delete("/dashboard/rsvp/:invitationId", authMiddleware, async (req, res) => {
//     try {
//       const { invitationId } = req.params;  
//       const invitation = await Invitation.findById(invitationId);
//       if (!invitation) return res.status(404).json({ msg: "Invitation not found" });
  
//       const event = await Event.findById(invitation.event);
//       if (!event) return res.status(404).json({ msg: "Event not found" });
  
//       if (event.organizer.toString() !== req.user.id) {
//         return res.status(401).json({ msg: "Not authorized to delete invitations for this event" });
//       }
  
//       await invitation.deleteOne();
  
//       res.json({ msg: "Invitation deleted successfully" });
//     } catch (error) {
//       console.error("Error deleting invitation:", error);
//       res.status(500).send("Server error");
//     }
//   });
  
module.exports = router;
