export function createBracketSvg(bracket) {
    const participants = bracket.songsShuffledWithByes.length;
    const levels = bracket.maxRounds;

    const boxSize = [500, 60];
    const boxGap = 8;
    const firstBracketSize = 100;
    const bracketSize = 500;

    const vbwidth = boxSize[0] + (bracketSize * (levels + 1));
    const vbheight = participants * boxSize[1] + (participants - 1) * boxGap;

    console.log(vbwidth, vbheight)

    let draw = SVG();
    draw.viewbox(-10, -10, vbwidth + 20, vbheight + 20);

    // Draw participants
    const drawPair = (index, half) => {
        if (!half) {
            for (let i = 0; i < 2; ++i) {
                draw
                    .rect(boxSize[0], boxSize[1])
                    .attr({x: 0, y: (index + i) * boxSize[1] + (index + i) * boxGap})
                    .fill("none")
                    .stroke({color: "black", width: 3});

                const textClip = draw.clip();
                textClip.add(
                    draw
                        .rect(boxSize[0], boxSize[1])
                        .attr({x: 0, y: (index + i) * boxSize[1] + (index + i) * boxGap})
                        .fill('#f06')
                );

                const text = draw.text(bracket.songsShuffledWithByes[(index + i)]?.name ?? "")
                    .font({size: 50})
                    .attr({x: 10, y: (index + i) * boxSize[1] + (index + i) * boxGap + boxSize[1] - 10});

                text.clipWith(textClip);
            }
        } else {
            draw
                .rect(boxSize[0], boxSize[1])
                .attr({x: 0, y: index * boxSize[1] + index * boxGap + (boxSize[1] + boxGap) / 2})
                .fill("none")
                .stroke({color: "black", width: 3});

            const textClip = draw.clip();
            textClip.add(
                draw
                    .rect(boxSize[0], boxSize[1])
                    .attr({x: 0, y: index * boxSize[1] + index * boxGap + (boxSize[1] + boxGap) / 2})
                    .fill('#f06')
            );

            const text = draw.text(bracket.songsShuffledWithByes[index]?.name ?? "")
                .font({size: 50})
                .attr({x: 10, y: index * boxSize[1] + index * boxGap + boxSize[1] - 10 + (boxSize[1] + boxGap) / 2});

            text.clipWith(textClip);
        }
    };

    // Iterate pairs, ignore bye matchups
    outer:
        for (let pair = 0; pair + 1 < participants; pair += 2) {
            for (let i = 0; i < 2; ++i) {
                const index = pair + i;
                if (bracket.songsShuffledWithByes[index].hasOwnProperty("bye")) {
                    // Ignore
                    drawPair(pair, true);
                    continue outer;
                }
            }

            drawPair(pair, false);
        }

    // Draw connections
    for (let level = 0; level < levels; ++level) {
        const interval = 1 << (level + 1);
        for (let participant = 0, w = 0; (participant + interval - 1) < participants; participant += interval, ++w) {
            const boxStartY = participant * boxSize[1] + participant * boxGap;
            const spacing = (interval * boxSize[1] + (interval - 1) * boxGap);
            const boxMidY = boxStartY + 0.25 * spacing;

            let drawBracket = true;

            console.log(level, participant, interval);
            if (level === 0 && (bracket.songsShuffledWithByes[participant].hasOwnProperty("bye")
                || bracket.songsShuffledWithByes[participant + 1].hasOwnProperty("bye")))
                drawBracket = false;

            const strokeWidth = 5 + 3 * level;
            if (drawBracket) {
                let leftOffset = 0;
                let rightOffset = 0;

                if (level !== 0) {
                    const leftPair = w * 2;
                    const leftMatchup = bracket.generatedMatchups[level - 1][leftPair];
                    const leftByeMatchup = leftMatchup.left.hasOwnProperty("bye") || leftMatchup.right.hasOwnProperty("bye");

                    const rightPair = w * 2 + 1;
                    const rightMatchup = bracket.generatedMatchups[level - 1][rightPair];
                    const rightByeMatchup = rightMatchup.left.hasOwnProperty("bye") || rightMatchup.right.hasOwnProperty("bye");

                    if (leftByeMatchup) leftOffset = -totalBracketWidth(0);
                    if (rightByeMatchup) rightOffset = -totalBracketWidth(0);
                }

                draw
                    .polyline([
                        [boxSize[0] + totalBracketWidth(level - 1) + leftOffset, boxMidY],
                        [boxSize[0] + totalBracketWidth(level), boxMidY],
                        [boxSize[0] + totalBracketWidth(level), boxStartY + 0.75 * spacing],
                        [boxSize[0] + totalBracketWidth(level - 1) + rightOffset, boxStartY + 0.75 * spacing]
                    ])
                    .fill("none")
                    .stroke({color: "black", width: strokeWidth});
            }

            // Draw winner from previous round
            // TODO adjust for stroke widths
            if (level !== 0) {
                const leftPair = w * 2;
                const leftMatchup = bracket.generatedMatchups[level - 1][leftPair];
                const leftWinner = bracket.roundResults[level][leftPair] ? leftMatchup.left : leftMatchup.right;

                const rightPair = w * 2 + 1;
                const rightMatchup = bracket.generatedMatchups[level - 1][rightPair];
                const rightWinner = bracket.roundResults[level][rightPair] ? rightMatchup.left : rightMatchup.right;

                if (bracket.roundResults[level]) {
                    // Left winner
                    draw.text(leftWinner.name)
                        .font({size: 50})
                        .attr({x: boxSize[0] + totalBracketWidth(level - 1) + 10, y: boxMidY - 12});

                    // Right winner
                    draw.text(rightWinner.name)
                        .font({size: 50})
                        .attr({
                            x: boxSize[0] + totalBracketWidth(level - 1) + 10,
                            y: boxMidY + (0.5 * spacing) - 12
                        });
                }
            }
        }
    }

    // Draw winner
    draw
        .polyline([
            [boxSize[0] + totalBracketWidth(levels - 1), vbheight / 2],
            [boxSize[0] + totalBracketWidth(levels - 1) + bracketSize, vbheight / 2],
        ])
        .stroke({color: "black", width: 5 + 3 * levels});

    if (bracket.winner) {
        draw.text(bracket.winner.name)
            .font({size: 50})
            .attr({
                x: boxSize[0] + totalBracketWidth(levels - 1) + 10,
                y: vbheight / 2 - 12
            });
    }

    function totalBracketWidth(level) {
        if (level === -1) return 0;
        return level * bracketSize + firstBracketSize;
    }

    return draw;
}
