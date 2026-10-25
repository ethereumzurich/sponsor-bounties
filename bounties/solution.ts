/**
 * Bounty Scan Parser
 * ------------------
 * Reads a markdown formatted bounty scan report from STDIN and outputs a JSON
 * array describing each bounty entry.
 *
 * Expected input format (example):
 *
 * 1. [[BOUNTY] API3 DAO - Use of first-party oracles [$1000]](https://github.com/ethereumzurich/sponsor-bounties/issues/3)
 * - **Repository:** [ethereumzurich/sponsor-bounties](https://github.com/ethereumzurich/sponsor-bounties)
 * - **Comments:** 4
 * - **Last Updated:** 2026-10-22T03:52:13Z
 *
 * The parser is tolerant to missing fields and extra whitespace.
 *
 * Usage:
 *   cat report.md | ts-node parseBounties.ts
 */

import * as readline from 'readline';

// Interface describing a single bounty entry
interface Bounty {
    index: number;
    title: string;
    issueUrl: string;
    repository?: {
        name: string;
        url: string;
    };
    comments?: number;
    lastUpdated?: string; // ISO string
}

// Helper regexes
const indexTitleRegex = /^\s*(\d+)\.\s*\[\[(.+?)\]\]\((https?:\/\/[^)]+)\)/;
const repoRegex = /^\s*-\s*\*\*Repository:\*\*\s*\[([^\]]+)\]\((https?:\/\/[^)]+)\)/i;
const commentsRegex = /^\s*-\s*\*\*Comments:\*\*\s*(\d+)/i;
const updatedRegex = /^\s*-\s*\*\*Last Updated:\*\*\s*([^\s].*)$/i;

// Read all stdin
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
});

let rawLines: string[] = [];

rl.on('line', (line) => {
    rawLines.push(line);
});

rl.on('close', () => {
    const bounties: Bounty[] = [];
    let current: Partial<Bounty> | null = null;

    for (let i = 0; i < rawLines.length; i++) {
        const line = rawLines[i];

        // Detect start of a new bounty entry
        const idxMatch = line.match(indexTitleRegex);
        if (idxMatch) {
            // Push previous entry if any
            if (current && typeof current.index === 'number') {
                bounties.push(current as Bounty);
            }

            // Start new entry
            current = {
                index: parseInt(idxMatch[1], 10),
                title: idxMatch[2].trim(),
                issueUrl: idxMatch[3].trim(),
            };
            continue;
        }

        if (!current) continue; // Skip lines before first entry

        // Repository line
        const repoMatch = line.match(repoRegex);
        if (repoMatch) {
            current.repository = {
                name: repoMatch[1].trim(),
                url: repoMatch[2].trim(),
            };
            continue;
        }

        // Comments line
        const commentsMatch = line.match(commentsRegex);
        if (commentsMatch) {
            current.comments = parseInt(commentsMatch[1], 10);
            continue;
        }

        // Last Updated line
        const updatedMatch = line.match(updatedRegex);
        if (updatedMatch) {
            current.lastUpdated = updatedMatch[1].trim();
            continue;
        }
    }

    // Push the last parsed entry
    if (current && typeof current.index === 'number') {
        bounties.push(current as Bounty);
    }

    // Output JSON
    console.log(JSON.stringify(bounties, null, 2));
});