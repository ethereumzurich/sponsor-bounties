/**
 * Bounty Scan Result Parser
 *
 * Parses a markdown formatted bounty scan report and extracts structured data.
 *
 * Expected input format (example):
 *
 *   #### 1. [[BOUNTY] API3 DAO - Use of first-party oracles [$1000]](https://github.com/ethereumzurich/sponsor-bounties/issues/3)
 *   - **Repository:** [ethereumzurich/sponsor-bounties](https://github.com/ethereumzurich/sponsor-bounties)
 *   - **Comments:** 4
 *   - **Last Updated:** 2026-10-22T03:52:13Z
 *
 * The parser is tolerant to missing fields and extra whitespace.
 */

interface BountyEntry {
    index: number;
    title: string;
    bountyTag?: string; // e.g., "[BOUNTY]"
    reward?: string;    // e.g., "[$1000]"
    issueUrl: string;
    repository?: {
        name: string;
        url: string;
    };
    comments?: number;
    lastUpdated?: string; // ISO string
}

/**
 * Parses a markdown bounty scan report.
 *
 * @param markdown - The raw markdown string.
 * @returns An array of BountyEntry objects.
 */
export function parseBountyScanResults(markdown: string): BountyEntry[] {
    const lines = markdown.split(/\r?\n/);
    const entries: BountyEntry[] = [];

    let current: Partial<BountyEntry> | null = null;

    const headerRegex = /^\s*####\s+(\d+)\.\s+\[([^\]]+)\]\(([^)]+)\)/;
    const repoRegex = /^\s*-\s+\*\*Repository:\*\*\s+\[([^\]]+)\]\(([^)]+)\)/i;
    const commentsRegex = /^\s*-\s+\*\*Comments:\*\*\s+(\d+)/i;
    const updatedRegex = /^\s*-\s+\*\*Last Updated:\*\*\s+([^\s].*)$/i;

    for (const rawLine of lines) {
        const line = rawLine.trim();

        // Detect new entry header
        const headerMatch = headerRegex.exec(line);
        if (headerMatch) {
            // Push previous entry if exists
            if (current && typeof current.index === 'number') {
                entries.push(current as BountyEntry);
            }

            const index = parseInt(headerMatch[1], 10);
            const titleRaw = headerMatch[2];
            const issueUrl = headerMatch[3];

            // Extract optional bounty tag and reward from title
            const bountyTagMatch = titleRaw.match(/\[([^\]]+)\]/);
            const rewardMatch = titleRaw.match(/\(\$[^\)]+\)/) ?? titleRaw.match(/\[\$[^\]]+\]/);
            const cleanTitle = titleRaw
                .replace(/\[[^\]]+\]/g, '') // remove tags like [BOUNTY]
                .replace(/\(\$[^\)]+\)/g, '') // remove reward in parentheses
                .replace(/\[\$[^\]]+\]/g, '') // remove reward in brackets
                .trim();

            current = {
                index,
                title: cleanTitle,
                issueUrl,
            };

            if (bountyTagMatch) {
                current.bountyTag = bountyTagMatch[1];
            }
            if (rewardMatch) {
                current.reward = rewardMatch[0];
            }

            continue;
        }

        if (!current) continue; // ignore lines before first header

        // Repository line
        const repoMatch = repoRegex.exec(line);
        if (repoMatch) {
            current.repository = {
                name: repoMatch[1],
                url: repoMatch[2],
            };
            continue;
        }

        // Comments line
        const commentsMatch = commentsRegex.exec(line);
        if (commentsMatch) {
            current.comments = parseInt(commentsMatch[1], 10);
            continue;
        }

        // Last updated line
        const updatedMatch = updatedRegex.exec(line);
        if (updatedMatch) {
            current.lastUpdated = updatedMatch[1].trim();
            continue;
        }
    }

    // Push the last parsed entry
    if (current && typeof current.index === 'number') {
        entries.push(current as BountyEntry);
    }

    return entries;
}

/* -------------------------- Example Usage -------------------------- */
// Uncomment the following block to test the parser locally.

// const exampleMarkdown = `
// ### Active Bounty Scan Results
//
// **Scan Time:** 2026-10-22 03:52 UTC
//
// #### 1. [[BOUNTY] API3 DAO - Use of first-party oracles [$1000]](https://github.com/ethereumzurich/sponsor-bounties/issues/3)
// - **Repository:** [ethereumzurich/sponsor-bounties](https://github.com/ethereumzurich/sponsor-bounties)
// - **Comments:** 4
// - **Last Updated:** 2026-10-22T03:52:13Z
//
// #### 2. [Map: seelite v1 — a classic-Elite trade–fight–explore loop in the browser](https://github.com/jcfischer/seelite/issues/1)
// - **Repository:** [jcfischer/seelite](https://github.com/jcfischer/seelite)
// - **Comments:** 2
// - **Last Updated:** 2026-10-21T18:20:45Z
// `;
//
// console.log(JSON.stringify(parseBountyScanResults(exampleMarkdown), null, 2));
/* ----------------------------------------------------------------- */

export default parseBountyScanResults;