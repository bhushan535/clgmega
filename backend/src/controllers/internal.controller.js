const { getIo } = require('../utils/socket');

exports.receiveEvent = async (req, res) => {
  try {
    const event = req.body;
    if (!event) return res.status(400).json({ error: 'Missing event body' });

    const io = getIo();
    // Emit only to teachers room
    io.to('teachers').emit('violation_event', event);

    return res.json({ status: 'ok' });
  } catch (err) {
    console.error('internal.receiveEvent error', err);
    return res.status(500).json({ error: 'server error' });
  }
};
