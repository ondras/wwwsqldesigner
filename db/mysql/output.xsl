<?xml version="1.0" ?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:output method="text"/>

<xsl:template name="replace-substring">
      <xsl:param name="value" />
      <xsl:param name="from" />
      <xsl:param name="to" />
      <xsl:choose>
         <xsl:when test="contains($value,$from)">
            <xsl:value-of select="substring-before($value,$from)" />
            <xsl:value-of select="$to" />
            <xsl:call-template name="replace-substring">
               <xsl:with-param name="value" select="substring-after($value,$from)" />
               <xsl:with-param name="from" select="$from" />
               <xsl:with-param name="to" select="$to" />
            </xsl:call-template>
         </xsl:when>
         <xsl:otherwise>
            <xsl:value-of select="$value" />
         </xsl:otherwise>
      </xsl:choose>
</xsl:template>

<xsl:template match="/sql">

<xsl:text>
-- ---
-- Globals
-- ---

-- SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";
-- SET FOREIGN_KEY_CHECKS=0;

</xsl:text>

<!-- tables -->
	<xsl:for-each select="table">
    <xsl:text>-- ---
-- Table '</xsl:text>
    <xsl:value-of select="@name" />
    <xsl:text>'
-- </xsl:text>
    <xsl:if test="comment">
	    <xsl:call-template name="replace-substring">
		    <xsl:with-param name="value" select="comment" />
		    <xsl:with-param name="from" select='"&apos;"' />
		    <xsl:with-param name="to" select='"&apos;&apos;"' />
	    </xsl:call-template>
    </xsl:if>
    <xsl:text>
-- ---

</xsl:text>

<xsl:text>DROP TABLE IF EXISTS `</xsl:text>
		<xsl:value-of select="@name" />
		<xsl:text>`;
		
</xsl:text>

<xsl:text>CREATE TABLE `</xsl:text>
		<xsl:value-of select="@name" />
		<xsl:text>` (
</xsl:text>
		<xsl:for-each select="row">
			<xsl:text>  `</xsl:text>
			<xsl:value-of select="@name" />
			<xsl:text>` </xsl:text>

			<xsl:value-of select="datatype" />
			<xsl:text></xsl:text>
			
			<xsl:choose>
				<xsl:when test="@null = 0"> NOT NULL</xsl:when>
				<xsl:otherwise> NULL</xsl:otherwise>
			</xsl:choose>
			
			<xsl:if test="@autoincrement = 1">
				<xsl:text> AUTO_INCREMENT</xsl:text>
			</xsl:if> 

			<xsl:if test="default">
				<xsl:text> DEFAULT </xsl:text>
				<xsl:value-of select="default" />
				<xsl:text></xsl:text>
			</xsl:if>

			<xsl:if test="comment">
				<xsl-text> COMMENT '</xsl-text>
				<xsl:call-template name="replace-substring">
					<xsl:with-param name="value" select="substring(comment, 1, 60)" />
					<xsl:with-param name="from" select='"&apos;"' />
					<xsl:with-param name="to" select='"&apos;&apos;"' />
				</xsl:call-template>
				<xsl-text>'</xsl-text>
			</xsl:if>

			<xsl:if test="not (position()=last())">
				<xsl:text>,
</xsl:text>
			</xsl:if> 
		</xsl:for-each>
		
<!-- keys -->
		<xsl:for-each select="key">
			<xsl:text>,
</xsl:text>
			<xsl:choose>
				<xsl:when test="@type = 'PRIMARY'">  PRIMARY KEY (</xsl:when>
				<xsl:when test="@type = 'FULLTEXT'">  FULLTEXT KEY (</xsl:when>
				<xsl:when test="@type = 'UNIQUE'">  UNIQUE KEY (</xsl:when>
				<xsl:otherwise>KEY (</xsl:otherwise>
			</xsl:choose>
			
			<xsl:for-each select="part">
				<xsl:text>`</xsl:text><xsl:value-of select="." /><xsl:text>`</xsl:text>
				<xsl:if test="not (position() = last())">
					<xsl:text>, </xsl:text>
				</xsl:if>
			</xsl:for-each>
			<xsl:text>)</xsl:text>
			
		</xsl:for-each>
		
		<xsl:text>
)</xsl:text>



    <xsl:if test="comment">
<xsl-text> COMMENT '</xsl-text>
            <xsl:call-template name="replace-substring">
                    <xsl:with-param name="value" select="substring(comment, 1, 60)" />
                    <xsl:with-param name="from" select='"&apos;"' />
                    <xsl:with-param name="to" select='"&apos;&apos;"' />
            </xsl:call-template>
<xsl-text>'</xsl-text>
    </xsl:if>
<xsl-text>;

</xsl-text>

	</xsl:for-each>

<xsl:text>-- ---
-- Foreign Keys 
-- ---

</xsl:text>

<!-- fk -->
	<xsl:for-each select="table">
		<xsl:for-each select="row">
			<xsl:for-each select="relation">
				<xsl:text>ALTER TABLE `</xsl:text>
				<xsl:value-of select="../../@name" />
				<xsl:text>` ADD FOREIGN KEY (</xsl:text>
				<xsl:value-of select="../@name" />
				<xsl:text>) REFERENCES `</xsl:text>
				<xsl:value-of select="@table" />
				<xsl:text>` (`</xsl:text>
				<xsl:value-of select="@row" />
				<xsl:text>`);
</xsl:text>
			</xsl:for-each>
		</xsl:for-each>
	</xsl:for-each>

<xsl:text>
-- ---
-- Table Properties
-- ---

</xsl:text>
	<xsl:for-each select="table">
    <xsl:text>-- ALTER TABLE `</xsl:text><xsl:value-of select="@name" />
    <xsl:text>` ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
</xsl:text>
	</xsl:for-each>



<xsl:text>
-- ---
-- Test Data
-- ---

</xsl:text>
        <xsl:for-each select="table">
    <xsl:text>-- INSERT INTO `</xsl:text><xsl:value-of select="@name" />
    <xsl:text>` (</xsl:text>
                    <xsl:for-each select="row">
                            <xsl:text>`</xsl:text>
                            <xsl:value-of select="@name" />
                            <xsl:text>`</xsl:text>
                            <xsl:if test="not (position()=last())">
    <xsl:text>,</xsl:text>
                            </xsl:if>
                    </xsl:for-each>
    <xsl:text>) VALUES
-- (</xsl:text>
                    <xsl:for-each select="row">
                            <xsl:text>''</xsl:text>

                            <xsl:if test="not (position()=last())">
    <xsl:text>,</xsl:text>
                            </xsl:if>
                    </xsl:for-each>

    <xsl:text>);
</xsl:text>
        </xsl:for-each>


</xsl:template>
</xsl:stylesheet>

