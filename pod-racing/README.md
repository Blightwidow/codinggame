# Mad pod racing

## Wood to Gold

For wood to gold, I used a simple strategy:

- If the angle with next checkpoint is less than 90, full thrust, otherwise 0
- Instead of targeting the checkpoint, substract you speed vector to correct trajectory harder
- Boost if available, distance to checkpoint is more than 4000 and angle is less than 15 degrees
- If next position will be at less than 500 than the center of the checkpoint, already angle yourself to next
  checkpoint (or if unknown the center of the map)

## Gold and more

Starting with gold, we have more option available. I wanted to use a Genetic algorithm. It does not work yet due to a
faulty simulation. I don't really know where is my issue, so I put it aside for now.

### TODO:
- [ ] Fix simulation
- [ ] Tweak genetic algorithm parameters
- [ ] Make algorithm control both bots
- [ ] Change shield coeff into a meta coeef to decide if shield, attack with first or attack with second
- [ ] Implement collision simulation
- [ ] Tweak init genes to optimize search speed
