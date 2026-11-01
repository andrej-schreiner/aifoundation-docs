// Round country flags from the "Onboard AI Model" Figma file (page Flags,
// frame "All the flags"), exported as SVG. Keyed by ISO 3166-1 alpha-2 code,
// plus `eu`. The Flag component renders them; client scripts that build table
// rows as HTML strings can use getFlag() for the URL.
import be from '../../assets/flags/be.svg?url';
import de from '../../assets/flags/de.svg?url';
import eu from '../../assets/flags/eu.svg?url';
import fr from '../../assets/flags/fr.svg?url';
import nl from '../../assets/flags/nl.svg?url';
import se from '../../assets/flags/se.svg?url';
import us from '../../assets/flags/us.svg?url';

export const flags: Record<string, string> = { be, de, eu, fr, nl, se, us };

/** English names, for the accessible name when a flag stands alone. */
export const flagNames: Record<string, string> = {
  be: 'Belgium',
  de: 'Germany',
  eu: 'European Union',
  fr: 'France',
  nl: 'Netherlands',
  se: 'Sweden',
  us: 'United States',
  globe: 'Worldwide',
};

export function getFlag(code: string): string {
  return flags[code.toLowerCase()] || '';
}
